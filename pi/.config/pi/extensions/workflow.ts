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
    thinking: "low",
  },
  codex: {
    provider: "openai-codex",
    model: "gpt-5.6-sol",
    thinking: "medium",
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
- use "planning" only if the task genuinely escalates to planner/plan-reviewer;
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

3. Read the selected issue, its acceptance criteria, relevant linked issues,
   and only the code/docs needed to execute it. Existing issue plans/checklists
   are the plan: do not redo broad planning merely for ceremony.
   - For a clear, already-planned task, implement directly.
   - If essential implementation details are genuinely missing, investigate
     them narrowly (use scout when useful).
   - Escalate to the planner -> plan-reviewer workflow only when the task lacks
     an actionable plan and the missing design is materially risky
     (schema/data migration, security, concurrency/state, broad compatibility,
     or similarly cross-cutting work).

4. Implement the selected issue completely. Stay within its scope and do not
   begin a second issue during this command.

5. Run the smallest meaningful verification set: focused tests/checks first,
   then broader checks only when the change warrants them.

6. For a non-trivial diff, delegate one independent read-only pass to reviewer.
   Fix valid blocking and important findings, then rerun the affected checks.
   Do not create an endless review loop and do not spend time on cosmetic nits.

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

8. Finish with a compact report: selected issue, what changed, verification,
   reviewer result/fixes, and the new current/next state (or why the issue could
   not be completed).
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
   - Treat an existing implementation plan/checklist in the issue as the plan;
     do not redo broad planning merely for ceremony.
   - If essential implementation details are genuinely missing, investigate
     them narrowly (use scout when useful).
   - Escalate to planner -> plan-reviewer only when the task lacks an actionable
     plan and the missing design is materially risky (schema/data migration,
     security, concurrency/state, broad compatibility, or similarly
     cross-cutting work).

3. Implement issue #${issueNumber} completely and stay within its scope.

4. Run the smallest meaningful verification set: focused tests/checks first,
   then broader checks only when the change warrants them.

5. For a non-trivial diff, delegate one independent read-only pass to reviewer.
   Fix valid blocking and important findings, then rerun the affected checks.
   Do not create an endless review loop and do not spend time on cosmetic nits.

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

7. Finish with a compact report: issue #${issueNumber}, what changed,
   verification, reviewer result/fixes, and any queue/handoff update performed
   (or why the issue could not be completed).
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
    const explicitRoute =
      firstToken &&
      NEXT_MODEL_ROUTES[firstToken.toLowerCase() as keyof typeof NEXT_MODEL_ROUTES];

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
    const match = input.match(/^#?(\d+)(?:\s+([\s\S]*))?$/);

    if (!match) {
      ctx.ui.notify("Usage: /i <issue-number> [instruction]", "warning");
      return;
    }

    const issueNumber = Number(match[1]);
    if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) {
      ctx.ui.notify("Issue number must be a positive integer", "warning");
      return;
    }

    const ok = await switchToBuildModel(ctx, "low");
    if (!ok) {
      return;
    }

    const extra = match[2]?.trim();
    const basePrompt = issueTaskPrompt(issueNumber);
    const prompt = extra
      ? `${basePrompt}\n\nAdditional instruction from me:\n${extra}`
      : basePrompt;

    startWorkflowStatus(ctx, "I", "low", {
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
      "Execute one next queued GitHub issue; optional model selector: ds, codex, agy",
    handler: runNext,
  });

  pi.registerCommand("i", {
    description:
      "Execute one specific GitHub issue through implementation, verification, review, and normal repository completion",
    handler: runIssue,
  });
}
