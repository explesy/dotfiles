---
description: Plan, independently review, and revise in one command
argument-hint: "<task>"
---

Create a reviewed implementation plan for this task:

${ARGUMENTS:-Use the concrete current task from this conversation.}

Do not implement or edit files. Do not write the plan or workflow script yourself.
Resolve the existing global script to an absolute path:
`$PI_CODING_AGENT_DIR/workflows/plan-review.js`, defaulting to
`~/.config/pi/workflows/plan-review.js` when the variable is unset.

Make exactly one foreground `subagent` call with `workflow` set to that absolute
file path, `args: { task: "<the concrete current task>" }`, and `async: false`.
Omit `clarify`: the new public workflow API rejects it even when false. Keep the request cwd as the current project, not the script's
directory. Do not use `workflowScript`, `workflowScriptPath`, or `workflow: true`.

The saved workflow runs read-only planner → independent plan-reviewer → one
planner revision when needed, using stable keys plan-draft, plan-review, and
plan-revise. It stops on failed children, missing/ambiguous verdicts, or
insufficient context. It never starts implementation or a second review pass.

Return the workflow's final plan first and its review verdict briefly below it.
If the workflow fails, report that failure instead of inventing a final plan.
