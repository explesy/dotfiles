import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { WorkflowMetrics } from "../lib/workflow-metrics.ts";
import {
  BUILD_PROVIDER,
  BUILD_MODEL,
  DEFAULT_NEXT_MODEL,
  NEXT_MODEL_ROUTES,
  findModelRoute,
  WORKFLOW_STATUS_PROTOCOL,
  EXECUTION_POLICY,
  NEXT_TASK_PROMPT,
  issueTaskPrompt,
  taskPrompt,
} from "../lib/workflow-policy.mjs";

type ThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];
type WorkflowKind = "N" | "I" | "B" | "BH";

type ModelRoute = {
  provider: string;
  model: string;
  thinking: ThinkingLevel;
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

export default function workflowCommands(pi: ExtensionAPI) {
  let revision = "unknown";
  try {
    revision = createHash("sha256")
      .update(readFileSync(new URL("./workflow.ts", import.meta.url)))
      .update(readFileSync(new URL("../lib/workflow-metrics.ts", import.meta.url)))
      .digest("hex").slice(0, 16);
  } catch { /* A missing revision must not disable the workflow. */ }
  let metricsContext: ExtensionContext | undefined;
  const metrics = new WorkflowMetrics({
    revision,
    onError: () => metricsContext?.ui.notify(
      "Workflow statistics could not be saved; task execution is unaffected.", "warning",
    ),
  });
  // Observers do not inspect message text/output or affect model/tool delivery.
  const observe = (callback: () => void) => { try { callback(); } catch { /* fail open */ } };
  const startMetrics = (ctx: ExtensionCommandContext, route: ModelRoute, kind: "task" | "context" | "issue" | "queue") => {
    metricsContext = ctx;
    if (!ctx.cwd || !ctx.sessionManager) return;
    observe(() => metrics.start({ cwd: ctx.cwd, sessionId: ctx.sessionManager.getSessionId(), kind, ...route }));
  };
  pi.on("tool_execution_start", event => observe(() => metrics.toolStart(event)));
  pi.on("tool_execution_end", event => observe(() => metrics.toolEnd(event)));
  pi.on("message_end", event => observe(() => metrics.messageEnd(event.message)));
  pi.on("ui_prompt_start", () => observe(() => metrics.pause()));
  pi.on("ui_prompt_end", () => observe(() => metrics.resume()));
  pi.on("model_select", () => observe(() => metrics.routingChanged()));
  pi.on("thinking_level_select", () => observe(() => metrics.routingChanged()));
  pi.on("session_switch", () => observe(() => metrics.finish("interrupted")));
  pi.on("session_shutdown", async () => {
    observe(() => metrics.finish("interrupted"));
    // A slow/unavailable custom state directory must not hold Pi open.
    await Promise.race([metrics.flush(), new Promise(resolve => setTimeout(resolve, 200))]);
  });
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
      observe(() => metrics.recordPhase(phase));

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

  let activeWorkflowResolve: (() => void) | undefined;

  const waitForWorkflowToSettle = (ctx: ExtensionCommandContext) => {
    if (typeof ctx.waitForIdle !== "function") {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      activeWorkflowResolve = resolve;
      setTimeout(() => {
        ctx.waitForIdle()
          .then(() => {
            if (activeWorkflowResolve) {
              activeWorkflowResolve = undefined;
              resolve();
            }
          })
          .catch(() => {
            if (activeWorkflowResolve) {
              activeWorkflowResolve = undefined;
              resolve();
            }
          });
      }, 50);
    });
  };

  // The footer must survive individual turns: clearing it on `turn_end` made
  // `workflow_status` unusable, because the first phase call always happens in a
  // later turn than the one that started the workflow. Clear only once the whole
  // agent run has settled, in addition to the explicit terminal phases above.
  pi.on("agent_settled", async (_event, ctx) => {
    observe(() => metrics.finish());
    if (activeWorkflowResolve) {
      const resolve = activeWorkflowResolve;
      activeWorkflowResolve = undefined;
      resolve();
    }

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
      const settled = waitForWorkflowToSettle(ctx);
      pi.sendUserMessage(task);
      await settled;
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
    startMetrics(ctx, route, "queue");
    const settled = waitForWorkflowToSettle(ctx);
    pi.sendUserMessage(prompt);
    await settled;
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
    startMetrics(ctx, route, issueNumber !== undefined ? "issue" : taskInput ? "task" : "context");
    const settled = waitForWorkflowToSettle(ctx);
    pi.sendUserMessage(prompt);
    await settled;
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
