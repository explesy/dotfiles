---
name: pr
description: Run one fast GPT-6 Sol Medium review of the current implementation plan without starting implementation.
---

Run exactly one independent pre-implementation review using the custom `plan-reviewer` agent. Do not independently perform the same review first, and do not begin implementation afterward.

Prefer the latest `REVIEW_HANDOFF` from the current plan when present. If it is missing, synthesize a compact handoff from the current chat only; do not reread the repository merely to build the handoff.

The handoff must contain:

`RUN_PLAN_REVIEW: true`

`CURRENT TASK:` exact current user request, scope, acceptance criteria, and material intent.

`PROPOSED PLAN:` the latest plan from this chat that we are actually about to implement.

`REVIEW_HANDOFF:` compact known decisions, relevant files/symbols/call paths, risky assumptions, and verification points. Reuse the planner's handoff verbatim when available.

`EXPECTED REVIEW SCOPE:` one line naming the exact task and plan target.

The reviewer should use supplied evidence first and inspect repository code only for a concrete doubtful, contradictory, or high-risk claim.

After the reviewer returns, verify REVIEW_SCOPE matches this task. Incorporate valid corrections into the current plan once. If the verdict is approve, keep the plan unchanged except for clearly useful clarifications. If the verdict is revise, present the corrected final plan. Do not run another review loop automatically and do not code yet.
