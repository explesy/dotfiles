---
description: Plan, independently review, and revise in one command
argument-hint: "<task>"
---

Create a reviewed implementation plan for this task:

${ARGUMENTS:-Use the concrete current task from this conversation.}

Do not implement or edit files. Do not write the plan yourself in the parent
session. Use exactly one foreground `subagent` call with `async: false`,
`clarify: false`, and a `workflowScript` that performs this sequence:

1. Run `planner` to inspect the repository and produce a self-contained
   implementation plan for the task.
2. Run `plan-reviewer` with a self-contained brief containing
   `RUN_PLAN_REVIEW: true`, the same current task, and the planner output as
   `PROPOSED PLAN`.
3. If the reviewer returns `PLAN_VERDICT: approve`, return the original plan
   as the final plan.
4. If the reviewer returns `PLAN_VERDICT: revise`, run a fresh `planner`
   pass that receives the current task, the original plan, and the full review.
   It must produce a corrected final plan that addresses blocking and important
   findings without blindly accepting weak suggestions.
5. If the reviewer returns `PLAN_VERDICT: insufficient-context`, stop the
   workflow and return the missing-context report instead of inventing details.

Use stable workflow keys `plan-draft`, `plan-review`, and `plan-revise`.
Keep all child runs read-only. The final response to me should contain the
final plan first and a short note with the review verdict. Do not require any
manual review command between stages.
