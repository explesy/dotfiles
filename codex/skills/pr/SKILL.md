---
name: pr
description: Run exactly one GPT-6 Sol High pre-implementation review of the current plan before coding.
---

Run exactly one independent pre-implementation plan review using the custom `plan-reviewer` agent. Do not independently perform the same review first, and do not begin implementation afterward.

Before spawning it, build a concise self-contained handoff from the current chat. It must begin with `RUN_PLAN_REVIEW: true` and contain:

`CURRENT TASK:` exact current user request, scope, acceptance criteria, and material intent.

`PROPOSED PLAN:` the latest plan from this chat that we are actually about to implement, preserving concrete steps/files/symbols when known.

`CURRENT DECISIONS AND CONSTRAINTS:` material decisions, compatibility, migration, security, cost, and operational constraints already established.

`RELEVANT CODE CONTEXT:` only known files/symbols/call paths/evidence needed to orient the reviewer; do not paste huge diffs.

`EXPECTED REVIEW SCOPE:` one line naming the exact task and plan target.

If CURRENT TASK or PROPOSED PLAN cannot be recovered unambiguously from the current chat, do not guess from repository documents. Report insufficient current plan context.

After the agent returns, verify REVIEW_SCOPE matches this task, discard findings belonging to a different/historical task, incorporate valid corrections into the current plan, and state whether the plan is approved or needs revision. Do not code yet.
