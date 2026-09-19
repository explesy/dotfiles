import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

type ThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4.1-flash";
const WORKFLOW_STATUS_KEY = "workflow";

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

1. Ground the current state first:
   - read the repository instructions that are directly relevant;
   - inspect git status and preserve unrelated working-tree changes;
   - identify the GitHub repository from the current checkout.

2. Read issue #${issueNumber}, its acceptance criteria, relevant comments and
   linked issues, and only the code/docs needed to execute it.
   - If the issue is already closed, ambiguous, explicitly gated, blocked by an
     unmet dependency, research-only, or otherwise not executable now, report
     that state and stop instead of bypassing the project's process.
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

  const setWorkflowStatus = (
    ctx: ExtensionCommandContext,
    text: string,
  ) => {
    ctx.ui.setStatus(WORKFLOW_STATUS_KEY, text);
    workflowStatusActive = true;
  };

  const shortTask = (task: string) =>
    task.length > 56 ? `${task.slice(0, 53)}...` : task;

  pi.on("turn_end", async (_event, ctx) => {
    if (!workflowStatusActive) {
      return;
    }

    ctx.ui.setStatus(WORKFLOW_STATUS_KEY, undefined);
    workflowStatusActive = false;
  });

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
      const command = thinking === "high" ? "BH" : "B";
      setWorkflowStatus(
        ctx,
        `${command} · DS4.1 · ${thinking} · ${shortTask(task)}`,
      );
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

    setWorkflowStatus(ctx, "N · DS4.1 · low · next queued issue");
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

    setWorkflowStatus(ctx, `I · DS4.1 · low · #${issueNumber}`);
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

  pi.registerCommand("i", {
    description:
      "Execute one specific GitHub issue through implementation, verification, review, and normal repository completion",
    handler: runIssue,
  });
}
