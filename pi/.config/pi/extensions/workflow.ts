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

const findModelRoute = (selector: string): ModelRoute | undefined => {
  const key = selector.toLowerCase();
  return Object.hasOwn(NEXT_MODEL_ROUTES, key)
    ? NEXT_MODEL_ROUTES[key as keyof typeof NEXT_MODEL_ROUTES]
    : undefined;
};

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
Use workflow_status only for meaningful phase changes, with a short task title
and issue number when known. Skip phases that are unnecessary for this task.
Finish with finishing, or blocked if required work cannot proceed.
`.trim();

const EXECUTION_POLICY = `
Complete the requested task within the user's authorization. Adapt the work to
the task and project; code, research, documentation and other deliverables do
not need the same ceremony. Do not select another task or add unrelated work.

1. Establish the original requirements and applicable project instructions.
   Inspect relevant state, preserve unrelated work, and search exact references
   before reading the minimum useful context. Existing plans are inputs to
   validate. Resolve routine choices yourself; ask only for missing decisions
   that materially affect the result, continuing safe independent work.
2. Make a short approach when useful, then do the work in the main session.
   Respect a request for planning without implementation; independent plan
   review needs an explicit instruction. Planning/scouting/review are not
   mandatory stages. Use additional
   read-only help only for a concrete uncertainty, meaningful regression risk,
   explicit request or project requirement. Use one suitable review pass when
   warranted: reviewer for ordinary work, reviewer-sol for material security,
   migration, concurrency or compatibility risk. Avoid fixed agent chains and
   repeated review loops. Follow stricter project/user rules.
3. If delegating review, supply the verbatim original task and acceptance
   requirements separately from your plan/summary, with the relevant source,
   diff and check results. For an issue, preserve the current body and relevant
   requirement comments as read. Preserve later user amendments separately;
   do not replace requirements with your interpretation. Review the complete
   affected behavior, including unchanged helpers and consumers. Confirm
   important findings from source/contracts or a focused reproduction before
   fixing them. Optional preferences and permitted behavior are not defects.
4. Choose checks by affected behavior, contracts and consumers, not diff size
   or filenames alone. For isolated changes use focused checks and applicable
   build/lint; for wider or uncertain impact broaden them. Explicit project/user
   checks remain mandatory. Run a needed full suite after review fixes; repeat
   it only when new changes/risk or an explicit requirement justify it. After
   test-only changes run the affected test/file. Capture real exit statuses
   (pipefail or saved check status for piped logs). Record known baseline
   failures; diagnose again only for new evidence or missing prior evidence.
5. Check the final deliverable against the original requirements. Fix material
   mismatches or explicitly report incomplete work and contract exceptions;
   documentation or review approval cannot authorize weaker requirements.
   Explain the practical result, why it helps, checks/coverage and remaining
   limitations in the user's language; scale detail to the task.

Do not infer authorization for external writes, delivery, deployment, purchases
or destructive actions from this command or repository conventions. Follow
existing authorization and finish all safe authorized work. Update an existing
issue/queue/handoff only when relevant and authorized; do not invent a backlog.

${WORKFLOW_STATUS_PROTOCOL}
`.trim();

const NEXT_TASK_PROMPT = `
Execute exactly one next task from this project's existing GitHub execution
queue. Read the canonical queue/current issue and respect blockers and unmet
dependencies; do not invent priorities. If no unambiguous executable next task
exists, report that rather than guessing. Once selected, read the issue body,
acceptance criteria and relevant comments as original requirements.

${EXECUTION_POLICY}
`.trim();

const issueTaskPrompt = (issueNumber: number) => `
Execute GitHub issue #${issueNumber} for the current project. Read its current
body, acceptance criteria and relevant comments; do not select another issue.
Respect closed/gated/blocked/research-only status and unmet dependencies rather
than silently bypassing them. Identify the repository from the checkout.

${EXECUTION_POLICY}
`.trim();

const taskPrompt = (task: string) => `
${task
  ? `Execute this original user task:\n\n${task}`
  : "Continue the concrete task already agreed in this conversation. Preserve its original requirements and later amendments. If no concrete task is agreed, ask what to do; do not choose a task or queue automatically."}

${EXECUTION_POLICY}
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
      ? findModelRoute(firstToken)
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
    const remainder = input.slice(firstToken.length).trim();
    // Preserve legacy model selectors before issue numbers/queue requests.
    // A task starting with "codex", "luna", etc. is otherwise literal text.
    const legacyRoute = /^#?\d+(?:\s|$)/.test(remainder) ||
      /^--next(?:\s|$)/.test(remainder)
      ? findModelRoute(firstToken)
      : undefined;
    const route = legacyRoute ?? NEXT_MODEL_ROUTES[DEFAULT_NEXT_MODEL];
    const taskInput = legacyRoute ? remainder : input;

    if (/^--next(?:\s|$)/.test(taskInput)) {
      const extra = taskInput.slice("--next".length).trim();
      await runNext(legacyRoute ? `${firstToken} ${extra}` : extra, ctx);
      return;
    }

    const match = taskInput.match(/^#?(\d+)(?:\s+([\s\S]*))?$/);
    const issueNumber = match ? Number(match[1]) : undefined;
    if ((issueNumber !== undefined &&
      (!Number.isSafeInteger(issueNumber) || issueNumber <= 0)) ||
      (!match && /^#\S+/.test(taskInput))) {
      ctx.ui.notify("Issue number must be a positive safe integer", "warning");
      return;
    }

    const ok = await switchToModel(ctx, route);
    if (!ok) return;

    const extra = match?.[2]?.trim();
    const prompt = issueNumber !== undefined
      ? `${issueTaskPrompt(issueNumber)}${extra ? `\n\nAdditional user requirement:\n${extra}` : ""}`
      : taskPrompt(taskInput);
    startWorkflowStatus(ctx, "I", route.thinking, {
      issueNumber,
      title: issueNumber === undefined && taskInput ? taskInput : undefined,
      phase: issueNumber === undefined ? "investigating" : "selecting",
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
      "Compatibility alias for /i --next; execute one next queued GitHub issue",
    handler: runNext,
  });

  pi.registerCommand("i", {
    description:
      "Execute a task, #issue, or agreed conversation task; --next uses the project queue",
    handler: runIssue,
  });
}
