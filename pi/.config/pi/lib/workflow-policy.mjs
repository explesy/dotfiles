export const BUILD_PROVIDER = "opencode-go";
export const BUILD_MODEL = "deepseek-v4.1-flash";

export const DEFAULT_NEXT_MODEL = "ds";
export const NEXT_MODEL_ROUTES = {
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
};

export const findModelRoute = (selector) => {
  const key = selector?.toLowerCase();
  return key && Object.hasOwn(NEXT_MODEL_ROUTES, key)
    ? NEXT_MODEL_ROUTES[key]
    : undefined;
};

export const WORKFLOW_STATUS_PROTOCOL = `
Use workflow_status only for meaningful phase changes, with a short task title
and issue number when known. Skip phases that are unnecessary for this task.
Finish with finishing, or blocked if required work cannot proceed.
`.trim();

export const EXECUTION_POLICY = `
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

export const NEXT_TASK_PROMPT = `
Execute exactly one next task from this project's existing GitHub execution
queue. Read the canonical queue/current issue and respect blockers and unmet
dependencies; do not invent priorities. If no unambiguous executable next task
exists, report that rather than guessing. Once selected, read the issue body,
acceptance criteria and relevant comments as original requirements.

${EXECUTION_POLICY}
`.trim();

export const issueTaskPrompt = (issueNumber) => `
Execute GitHub issue #${issueNumber} for the current project. Read its current
body, acceptance criteria and relevant comments; do not select another issue.
Respect closed/gated/blocked/research-only status and unmet dependencies rather
than silently bypassing them. Identify the repository from the checkout.

${EXECUTION_POLICY}
`.trim();

export const taskPrompt = (task) => `
${task
  ? `Execute this original user task:\n\n${task}`
  : "Continue the concrete task already agreed in this conversation. Preserve its original requirements and later amendments. If no concrete task is agreed, ask what to do; do not choose a task or queue automatically."}

${EXECUTION_POLICY}
`.trim();
