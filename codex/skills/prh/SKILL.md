---
name: prh
description: Run one GPT-6 Sol High deep review of the current implementation plan for risky, cross-cutting, or doubtful work.
---

Run exactly one deep independent pre-implementation review using the custom `plan-reviewer-high` agent. Do not perform a duplicate expensive review in the parent first, and do not begin implementation afterward.

Use this for plans involving schema/data migration, security, concurrency/state, broad compatibility, high blast radius, difficult rollback, or when the normal `$pr` result still leaves genuine doubt.

Prefer the latest `REVIEW_HANDOFF` when present. Otherwise synthesize a concise self-contained handoff from the current chat.

The handoff must contain:

`RUN_PLAN_REVIEW_HIGH: true`

`CURRENT TASK:` exact current user request, scope, acceptance criteria, and material intent.

`PROPOSED PLAN:` the latest plan from this chat that we are actually about to implement.

`REVIEW_HANDOFF:` current decisions and constraints, known files/symbols/call paths, risky assumptions, migration/state/security concerns, and expected verification.

`EXPECTED REVIEW SCOPE:` one line naming the exact task and plan target.

After the reviewer returns, verify REVIEW_SCOPE matches this task and incorporate valid corrections into the current plan once. Present the corrected final plan and whether it is approved or still blocked. Do not start implementation and do not create a review/fix/review loop automatically.
