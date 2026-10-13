import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type ThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];
type WorkflowKind = "N" | "I" | "B" | "BH";

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4.1-flash";

type ModelRoute = {
  provider: string;
  model: string;
  thinking: ThinkingLevel;
};

const DEFAULT_NEXT_MODEL = "ds";
const NEXT_MODEL_ROUTES = {
  ds: {
    provider: "opencode-go",
    model: "deepseek-v4.1-flash",
    thinking: "high",
  },
  codex: {
    provider: "openai-codex",
    model: "gpt-6.1-sol",
    thinking: "medium",
  },
  luna: {
    provider: "openai-codex",
    model: "gpt-6-luna",
    thinking: "high",
  },
  agy: {
    provider: "antigravity",
    model: "gemini-3-8-flash",
    thinking: "low",
  },
} satisfies Record<string, ModelRoute>;

const WORKFLOW_STATUS_KEY = "workflow";
/**
 * Phases that end the run: the footer is cleared immediately so a finished or
 * stopped workflow does not keep looking active.
 */
const TERMINAL_STATUS_PHASES = new Set(["finishing", "blocked"]);
const STATUS_PHASES = new Set([
  "selecting",
  "selected",
  "investigating",
  "planning",
  "implementing",
  "testing",
  "reviewing",
  "fixing",
  "finishing",
  "blocked",
]);

const WORKFLOW_STATUS_PROTOCOL = `
Keep the Pi footer useful during this workflow by calling workflow_status only
when the major phase changes. This tool is UI-only; it never replaces actual
work.

- after the issue is known, call phase "selected" with its number and short
  title;
- use "investigating" for narrow code/repository investigation after selection;
- use "planning" while assessing a non-trivial issue plan or escalating it;
- call "implementing" immediately before the main implementation work;
- call "testing" immediately before verification;
- call "reviewing" immediately before the independent reviewer pass;
- if reviewer findings require changes, call "fixing" before those fixes;
- call "finishing" before issue/queue/handoff completion;
- if execution must stop because the issue is blocked or ambiguous, call
  "blocked" before the final explanation.

Do not call workflow_status for every tool invocation. One call per meaningful
phase transition is enough.
`.trim();

const REVIEW_FINDING_POLICY = `
Before changing the plan or implementation for a blocking/important finding,
the main worker must confirm it against the current code, contracts, issue
requirements, or a focused reproduction/check. Record the source location and
concrete failure mode. Check whether the requirement is already satisfied;
reviewer severity and verdict alone are not evidence. Reject unsupported or
contradicted findings with a short explanation. If the evidence is unavailable
and the concern remains material, report the unresolved blocker.
`.trim();

const ISSUE_PLAN_POLICY = `
Before implementation, establish that the plan is actionable; an existing
GitHub issue plan/checklist is input, not proof that the plan is complete.

1. Main worker (DeepSeek by default) compares the issue and relevant comments,
   acceptance criteria, repository instructions, and focused code evidence.
   Check that each requirement maps to concrete changes and verification, and
   that file names, symbols, contracts, dependencies, and edge cases match the
   current repository. If the plan is absent or incomplete, draft or repair it
   before implementation. Record assumptions and unresolved risks.
2. Classify risk before relying on any reviewer verdict. Escalate to Luna
   planning followed by GPT-6.1 Sol / plan-reviewer at high thinking for schema
   or data migrations, security boundaries, changes to concurrency or shared
   state behavior (update ordering, synchronization, ownership, idempotency,
   or failure recovery), broad API or compatibility changes, or similarly
   cross-cutting work. Classify the proposed changes, not task keywords or the
   mere presence of a cache. Observation-only work may use the ordinary route
   only after code evidence shows it preserves those behaviors; new mutable
   counters or other shared state still require that assessment. Record the
   affected invariant and evidence for the route. Material uncertainty uses
   the risky route. Existing plans in the issue do not waive this escalation.
   Invoke planner through the
   subagent tool with async: false, passing the issue requirements, relevant
   code evidence, and any existing plan. Then invoke plan-reviewer with
   async: false and a self-contained brief containing RUN_PLAN_REVIEW: true,
   CURRENT TASK, and PROPOSED PLAN. Keep the full review available to the main
   worker for evidence validation before requesting any plan corrections.
3. For a non-trivial ordinary task, send the task, requirements, corrected plan,
   and relevant code evidence to plan-reviewer-haiku for an independent review
   at medium thinking using the subagent tool with async: false. If Haiku
   surfaces a risk from the escalation list, check its evidence and switch to
   Luna planning and Sol review when the risk is confirmed or remains material
   and unresolved.
4. For a genuinely mechanical, narrowly scoped change (such as a typo or
   local wording/config value with no behavior or contract impact), skip the
   separate plan review and verify the change directly.
5. If required context is unavailable or material concerns remain unresolved,
   stop and report the blocker rather than treating a reviewer approval as
   proof. After an approved plan, implement, verify, then run the independent
   code review described below.

${REVIEW_FINDING_POLICY}

For either review route, correct the plan only after the main worker validates
material findings. Use the main worker for ordinary plan corrections and
planner for risky ones. If the plan changes materially, request at most one
focused follow-up review before implementation; stop if material concerns
remain unresolved.
`.trim();

const ISSUE_CODE_REVIEW_POLICY = `
For a non-trivial diff, reassess risk using the actual changes and the same
risk criteria used before planning. If the task was classified as risky, or
the implementation introduces those risks, delegate one independent read-only
pass to reviewer-sol (GPT-6.1 Sol, high). Otherwise use reviewer (Haiku 5.5,
medium). Invoke the selected agent through the subagent tool with async: false;
include the task, accepted plan, relevant diff/code, and verification results.
Ask the reviewer to check acceptance criteria first, including contract-valid
exceptional paths, required input fields, and preserved behavior. A confirmed
requirement violation is at least important even if rarely triggered.
Confirm blocking/important findings using the evidence policy before changing
code, fix confirmed findings, then rerun affected checks. Do not create an
endless review loop or spend time on cosmetic nits.
`.trim();

const ISSUE_VERIFICATION_POLICY = `
Select checks from the actual behavior changed, contracts, call sites and
consumers, not only changed filenames or diff size. For isolated changes with
known boundaries, run the relevant module/consumer and success/error-path
checks plus applicable build/lint; do not default to the full suite. Explain
what is covered and what is not. Missing coverage is a gap, not a passing test.
Use broader/full checks for releases, broad refactors, shared interfaces/data
formats, dependencies, test/runtime infrastructure, shared-state/concurrency
or security invariants, uncertain impact, or evidence of a wider regression.
Repository/user-required checks remain mandatory. Run focused checks and
applicable build/lint before review. If a full suite is needed, run it after
review fixes on the ready implementation. Reuse earlier check evidence only
where later changes do not affect the checked behavior. After a test-only
addition/correction run that test or file; after a local code fix rerun affected
checks and applicable build/lint. Repeat the full suite only for a new impact
reason above or an explicit requirement, and state that reason.
Capture the actual exit status of each check. When piping output through tail
or tee, use pipefail in a shell that supports it, or capture the check's status
before displaying its log; the last pipeline command is not test evidence.
For a previously confirmed baseline failure, record the failed check and its
existing evidence. Repeat baseline diagnosis only if symptoms, relevant code,
or environment changed, or that evidence is unavailable. Never call a failing
full suite green or skip a required check because its failure is known.
Before finishing, after review fixes, make a compact acceptance map: each
requirement -> implementation location -> concrete verification/result ->
status: verified, verification-gap, contract-exception, or not-implemented.
verified means implemented and checked; verification-gap means the code exists
but checking is incomplete; contract-exception means the implementation is
narrower or different. Explicitly list every exception to the original task.
Documentation, tests of an exception, and reviewer approval do not authorize
changing a requirement. Routine implementation choices within the contract
remain yours; fix material mismatches or report incomplete work. If a referenced
standard was not checked, record that verification gap rather than full support.
Include required fields, contract-valid failure paths, and preserved behavior
where relevant. A reviewer verdict or total test count does not replace this
map. For a coverage gap, run the smallest meaningful check; if verification
cannot be completed, report the gap rather than claiming full completion.
`.trim();

const HUMAN_REPORT_PROTOCOL = `
The final response is a two-layer report for the project owner, not a raw
engineering log. Preserve access to technical depth, but do not make the owner
decode internal vocabulary just to understand what happened.

Layer 1 — human summary:
- write in the user's language;
- start with the practical result: what changed, why it matters, and what the
  system/project does differently now;
- use plain domain language and concrete behavior, not class names, table names,
  internal statuses, pipeline jargon, or implementation vocabulary;
- if an internal term is unavoidable, explain the meaning first and put the
  exact term in parentheses afterwards;
- include concise verification/reviewer outcome and current/next queue state
  when relevant;
- for a blocked run, explain the practical blocker first, then its technical
  cause.

Layer 2 — technical details:
- keep a separate "Technical details" / "Технические детали" section after the
  human summary;
- include the important internal terms, affected components/files, verification,
  reviewer findings/fixes, constraints, and implementation details needed to
  inspect the work more deeply;
- stay concise by default, but do not hide relevant complexity. The user can ask
  to expand any item further.

Never use shorthand such as "negative episode" as if it were self-explanatory:
describe the observed result or absence signal instead.
`.trim();

const NEXT_TASK_PROMPT = `
Execute exactly one next queued GitHub issue for this repository end-to-end.

Use the project's existing GitHub Issues, queue, labels, project fields, docs,
and repository instructions as the source of truth. Do not invent a parallel
backlog or silently reprioritize planned work.

${WORKFLOW_STATUS_PROTOCOL}

1. Ground the current state first:
   - read the repository instructions that are directly relevant;
   - inspect git status and preserve unrelated working-tree changes;
   - identify the GitHub repository from the current checkout.

2. Select the next task from the existing execution system:
   - prefer an explicit canonical execution queue / START HERE issue when one
     exists;
   - otherwise prefer the issue marked current, then next, then the first
     unfinished unblocked item in an explicitly ordered queue;
   - respect gated, blocked, research-only, dated, and dependency conditions;
   - if there is no unambiguous next task, or the apparent next task is blocked,
     call workflow_status with phase "blocked", report the ambiguity/blocker,
     and stop instead of guessing;
   - as soon as the task is selected, call workflow_status with phase
     "selected", issue number, and a short issue title.

3. Read the selected issue, acceptance criteria, relevant comments/links, and
   the focused code/docs needed to verify an actionable plan. Existing issue
   plans are evidence to check, not automatic approval.
   ${ISSUE_PLAN_POLICY.split("\n").join("\n   ")}

4. Implement the selected issue completely. Stay within its scope and do not
   begin a second issue during this command.

5. Run the smallest meaningful verification set: focused tests/checks first,
   then broader checks only when the change warrants them.
   ${ISSUE_VERIFICATION_POLICY.split("\n").join("\n   ")}

6. ${ISSUE_CODE_REVIEW_POLICY.split("\n").join("\n   ")}

7. Finish the repository workflow honestly:
   - satisfy the issue acceptance criteria before marking it complete;
   - follow existing branch/commit/push/PR conventions instead of inventing a
     new Git workflow;
   - close the GitHub issue only when the completed code/docs are actually
     delivered according to that repository's normal workflow;
   - when the repository has a documented current/next queue, advance it using
     that existing mechanism and update its handoff/current document when the
     project explicitly requires that;
   - never invent new queue labels or silently reorder unrelated backlog items.

8. Finish using the two-layer owner report below. Include the selected issue,
   practical result, verification, reviewer result/fixes, and the new
   current/next state (or why the issue could not be completed).

${HUMAN_REPORT_PROTOCOL}
`.trim();

const issueTaskPrompt = (issueNumber: number) => `
Execute GitHub issue #${issueNumber} for this repository end-to-end.

Use the issue, repository instructions, existing docs, and the project's
established GitHub workflow as the source of truth. Do not select or begin a
different issue during this command.

${WORKFLOW_STATUS_PROTOCOL}

1. Ground the current state first:
   - read the repository instructions that are directly relevant;
   - inspect git status and preserve unrelated working-tree changes;
   - identify the GitHub repository from the current checkout.

2. Read issue #${issueNumber}, its acceptance criteria, relevant comments and
   linked issues, and only the code/docs needed to execute it.
   - As soon as its title is known, call workflow_status with phase "selected",
     issue ${issueNumber}, and the short issue title.
   - If the issue is already closed, ambiguous, explicitly gated, blocked by an
     unmet dependency, research-only, or otherwise not executable now, call
     workflow_status with phase "blocked", report that state, and stop instead
     of bypassing the project's process.
   ${ISSUE_PLAN_POLICY.split("\n").join("\n   ")}

3. Implement issue #${issueNumber} completely and stay within its scope.

4. Run the smallest meaningful verification set: focused tests/checks first,
   then broader checks only when the change warrants them.
   ${ISSUE_VERIFICATION_POLICY.split("\n").join("\n   ")}

5. ${ISSUE_CODE_REVIEW_POLICY.split("\n").join("\n   ")}

6. Finish the repository workflow honestly:
   - satisfy the issue acceptance criteria before marking it complete;
   - follow existing branch/commit/push/PR conventions instead of inventing a
     new Git workflow;
   - close issue #${issueNumber} only when the completed code/docs are actually
     delivered according to that repository's normal workflow;
   - update an existing current/next queue only when issue #${issueNumber} is
     represented there and the repository's documented workflow requires it;
   - never invent new queue labels, silently reorder unrelated backlog items, or
     advance unrelated work.

7. Finish using the two-layer owner report below. Include issue
   #${issueNumber}, practical result, verification, reviewer result/fixes, and
   any queue/handoff update performed (or why the issue could not be completed).

${HUMAN_REPORT_PROTOCOL}
`.trim();

export default function workflowCommands(pi: ExtensionAPI) {
  let workflowStatusActive = false;
  let workflowKind: WorkflowKind | undefined;
  let workflowThinking: ThinkingLevel = "low";
  // Human-readable label of the model that actually got selected. Derived from
  // the resolved model instead of a hardcoded brand string so the footer cannot
  // silently lie after BUILD_MODEL changes.
  let workflowModelLabel = BUILD_MODEL;
  let workflowIssueNumber: number | undefined;
  let workflowIssueTitle: string | undefined;

  const compactText = (value: string, maxLength = 48) => {
    const compact = value.replace(/\s+/g, " ").trim();
    return compact.length > maxLength
      ? `${compact.slice(0, maxLength - 3)}...`
      : compact;
  };

  const buildWorkflowStatus = (phase?: string) => {
    const parts = [
      workflowKind,
      workflowModelLabel,
      workflowThinking,
      workflowIssueNumber ? `#${workflowIssueNumber}` : undefined,
      phase,
      workflowIssueTitle,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  };

  const setWorkflowStatus = (
    ctx: ExtensionContext,
    text: string,
  ) => {
    ctx.ui.setStatus(WORKFLOW_STATUS_KEY, text);
    workflowStatusActive = true;
  };

  const startWorkflowStatus = (
    ctx: ExtensionContext,
    kind: WorkflowKind,
    thinking: ThinkingLevel,
    options: {
      issueNumber?: number;
      title?: string;
      phase?: string;
    } = {},
  ) => {
    workflowKind = kind;
    workflowThinking = thinking;
    workflowIssueNumber = options.issueNumber;
    workflowIssueTitle = options.title
      ? compactText(options.title)
      : undefined;
    setWorkflowStatus(ctx, buildWorkflowStatus(options.phase));
  };

  const clearWorkflowStatus = (ctx: ExtensionContext) => {
    ctx.ui.setStatus(WORKFLOW_STATUS_KEY, undefined);
    workflowStatusActive = false;
    workflowKind = undefined;
    workflowThinking = "low";
    workflowModelLabel = BUILD_MODEL;
    workflowIssueNumber = undefined;
    workflowIssueTitle = undefined;
  };

  pi.registerTool({
    name: "workflow_status",
    label: "Workflow status",
    description:
      "Update the footer for an active /n or /i workflow when its major phase changes. UI-only; never changes repository state.",
    promptSnippet:
      "workflow_status: update the active /n or /i footer on major phase transitions.",
    parameters: Type.Object({
      phase: Type.String({
        description:
          "One of: selecting, selected, investigating, planning, implementing, testing, reviewing, fixing, finishing, blocked. finishing and blocked end the run and clear the footer.",
      }),
      issue: Type.Optional(
        Type.Integer({
          minimum: 1,
          description: "Selected GitHub issue number when known",
        }),
      ),
      title: Type.Optional(
        Type.String({
          description: "Short selected issue title; keep it concise",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      // Validate the tool's own contract before the workflow state: an invalid
      // phase is a caller mistake and should be diagnosable even when no
      // workflow is active.
      const phase = compactText(params.phase, 20);
      if (!STATUS_PHASES.has(phase)) {
        return {
          content: [
            {
              type: "text",
              text: `Unsupported workflow phase: ${phase}`,
            },
          ],
          details: { updated: false },
        };
      }

      if (!workflowStatusActive || !workflowKind) {
        return {
          content: [
            {
              type: "text",
              text: "No active workflow command; footer status unchanged.",
            },
          ],
          details: { updated: false },
        };
      }

      if (params.issue !== undefined) {
        workflowIssueNumber = params.issue;
      }
      if (params.title) {
        workflowIssueTitle = compactText(params.title);
      }

      const status = buildWorkflowStatus(phase);

      // Terminal phases end the run, so do not leave the footer pinned as if
      // the workflow were still active. Read the resolved issue/title before the
      // clear resets them.
      if (TERMINAL_STATUS_PHASES.has(phase)) {
        const resolvedIssue = workflowIssueNumber;
        const resolvedTitle = workflowIssueTitle;
        clearWorkflowStatus(ctx);
        return {
          content: [
            {
              type: "text",
              text: `Footer cleared after terminal phase: ${status}`,
            },
          ],
          details: {
            updated: true,
            cleared: true,
            phase,
            issue: resolvedIssue,
            title: resolvedTitle,
          },
        };
      }

      ctx.ui.setStatus(WORKFLOW_STATUS_KEY, status);

      return {
        content: [{ type: "text", text: `Footer: ${status}` }],
        details: {
          updated: true,
          phase,
          issue: workflowIssueNumber,
          title: workflowIssueTitle,
        },
      };
    },
  });

  // The footer must survive individual turns: clearing it on `turn_end` made
  // `workflow_status` unusable, because the first phase call always happens in a
  // later turn than the one that started the workflow. Clear only once the whole
  // agent run has settled, in addition to the explicit terminal phases above.
  pi.on("agent_settled", async (_event, ctx) => {
    if (!workflowStatusActive) {
      return;
    }

    clearWorkflowStatus(ctx);
  });

  const switchToModel = async (
    ctx: ExtensionCommandContext,
    route: ModelRoute,
  ) => {
    const model = ctx.modelRegistry.find(route.provider, route.model);
    if (!model) {
      ctx.ui.notify(
        `Model not found: ${route.provider}/${route.model}`,
        "error",
      );
      return false;
    }

    const ok = await pi.setModel(model);
    if (!ok) {
      ctx.ui.notify(
        `No authentication configured for ${route.provider}/${route.model}`,
        "error",
      );
      return false;
    }

    // Footer label comes from the model that actually got selected.
    workflowModelLabel = model.name?.trim() || model.id || route.model;
    pi.setThinkingLevel(route.thinking);
    return true;
  };

  const switchToBuildModel = async (
    ctx: ExtensionCommandContext,
    thinking: ThinkingLevel,
  ) =>
    switchToModel(ctx, {
      provider: BUILD_PROVIDER,
      model: BUILD_MODEL,
      thinking,
    });

  const runBuild = async (
    args: string,
    ctx: ExtensionCommandContext,
    thinking: ThinkingLevel,
  ) => {
    const ok = await switchToBuildModel(ctx, thinking);
    if (!ok) {
      return;
    }

    const task = args.trim();
    if (task) {
      const kind: WorkflowKind = thinking === "high" ? "BH" : "B";
      startWorkflowStatus(ctx, kind, thinking, {
        title: compactText(task, 56),
      });
      pi.sendUserMessage(task);
      return;
    }

    ctx.ui.notify(
      `Build model: ${BUILD_PROVIDER}/${BUILD_MODEL} · ${thinking}`,
      "info",
    );
  };

  const runBuildLow = (args: string, ctx: ExtensionCommandContext) =>
    runBuild(args, ctx, "low");

  const runBuildHigh = (args: string, ctx: ExtensionCommandContext) =>
    runBuild(args, ctx, "high");

  const runNext = async (args: string, ctx: ExtensionCommandContext) => {
    const input = args.trim();
    const firstSpace = input.search(/\s/);
    const firstToken =
      firstSpace === -1 ? input : input.slice(0, firstSpace);
    const explicitRoute = firstToken
      ? NEXT_MODEL_ROUTES[
          firstToken.toLowerCase() as keyof typeof NEXT_MODEL_ROUTES
        ]
      : undefined;

    const route = explicitRoute ?? NEXT_MODEL_ROUTES[DEFAULT_NEXT_MODEL];
    const extra = explicitRoute
      ? input.slice(firstToken.length).trim()
      : input;

    const ok = await switchToModel(ctx, route);
    if (!ok) {
      return;
    }

    const prompt = extra
      ? `${NEXT_TASK_PROMPT}\n\nAdditional instruction from me:\n${extra}`
      : NEXT_TASK_PROMPT;

    startWorkflowStatus(ctx, "N", route.thinking, { phase: "selecting" });
    pi.sendUserMessage(prompt);
  };

  const runIssue = async (args: string, ctx: ExtensionCommandContext) => {
    const input = args.trim();
    const firstSpace = input.search(/\s/);
    const firstToken = firstSpace === -1 ? input : input.slice(0, firstSpace);
    const explicitRoute = firstToken
      ? NEXT_MODEL_ROUTES[
          firstToken.toLowerCase() as keyof typeof NEXT_MODEL_ROUTES
        ]
      : undefined;
    const route = explicitRoute ?? NEXT_MODEL_ROUTES[DEFAULT_NEXT_MODEL];
    const issueInput = explicitRoute
      ? input.slice(firstToken.length).trim()
      : input;
    const match = issueInput.match(/^#?(\d+)(?:\s+([\s\S]*))?$/);

    if (!match) {
      ctx.ui.notify(
        "Usage: /i [ds|codex|luna|agy] <issue-number> [instruction]",
        "warning",
      );
      return;
    }

    const issueNumber = Number(match[1]);
    if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) {
      ctx.ui.notify("Issue number must be a positive integer", "warning");
      return;
    }

    const ok = await switchToModel(ctx, route);
    if (!ok) {
      return;
    }

    const extra = match[2]?.trim();
    const basePrompt = issueTaskPrompt(issueNumber);
    const prompt = extra
      ? `${basePrompt}\n\nAdditional instruction from me:\n${extra}`
      : basePrompt;

    startWorkflowStatus(ctx, "I", route.thinking, {
      issueNumber,
      phase: "selecting",
    });
    pi.sendUserMessage(prompt);
  };

  pi.registerCommand("build", {
    description:
      "Switch to DeepSeek V4.1 Flash low-thinking build model and optionally run a task",
    handler: runBuildLow,
  });

  pi.registerCommand("b", {
    description: "Alias for /build",
    handler: runBuildLow,
  });

  pi.registerCommand("bh", {
    description:
      "Switch to DeepSeek V4.1 Flash high-thinking build model and optionally run a hard task",
    handler: runBuildHigh,
  });

  pi.registerCommand("n", {
    description:
      "Execute one next queued GitHub issue; optional model selector: ds, codex, luna, agy",
    handler: runNext,
  });

  pi.registerCommand("i", {
    description:
      "Execute one specific GitHub issue; optional model selector: ds, codex, luna, agy",
    handler: runIssue,
  });
}
