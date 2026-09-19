import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

type ThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4.1-flash";

const NEXT_TASK_PROMPT = `
Execute exactly one next queued GitHub issue for this repository end-to-end.

Use the project's existing GitHub Issues, queue, labels, project fields, docs,
and repository instructions as the source of truth. Do not invent a parallel
backlog or silently reprioritize planned work.

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
     report the ambiguity/blocker and stop instead of guessing.

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

6. For a non-trivial diff, delegate exactly one independent read-only pass to
   delivery-reviewer. Give it the selected issue/task, acceptance criteria,
   intended behavior, and tell it to inspect the actual working-tree diff.
   Fix valid blocking and important findings, then rerun the affected checks.
   Do not create a second independent review loop and do not spend time on
   cosmetic nits.

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

export default function workflowCommands(pi: ExtensionAPI) {
  const switchToBuildModel = async (
    ctx: ExtensionCommandContext,
    thinking: ThinkingLevel,
  ) => {
    const model = ctx.modelRegistry.find(BUILD_PROVIDER, BUILD_MODEL);
    if (!model) {
      ctx.ui.notify(
        `Build model not found: ${BUILD_PROVIDER}/${BUILD_MODEL}`,
        "error",
      );
      return false;
    }

    const ok = await pi.setModel(model);
    if (!ok) {
      ctx.ui.notify(
        `No authentication configured for ${BUILD_PROVIDER}/${BUILD_MODEL}`,
        "error",
      );
      return false;
    }

    pi.setThinkingLevel(thinking);
    return true;
  };

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
    const ok = await switchToBuildModel(ctx, "low");
    if (!ok) {
      return;
    }

    const extra = args.trim();
    const prompt = extra
      ? `${NEXT_TASK_PROMPT}\n\nAdditional instruction from me:\n${extra}`
      : NEXT_TASK_PROMPT;

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
      "Execute exactly one next queued GitHub issue through implementation, verification, review, and queue update",
    handler: runNext,
  });
}
