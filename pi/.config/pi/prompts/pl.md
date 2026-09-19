---
description: Review the current implementation plan with Terra
argument-hint: "[focus]"
---

Use the `plan-reviewer` agent now. Do not perform the review yourself.

Build a self-contained assignment for it from the current conversation:
- `RUN_PLAN_REVIEW: true`
- `CURRENT TASK`
- `PROPOSED PLAN`
- relevant current decisions/constraints and code context when useful
- additional review focus: ${ARGUMENTS:-No additional focus.}

Pass the actual current proposed plan, not an old repository plan. If there is
no concrete proposed plan in the current conversation, stop and tell me that
instead of inventing one.

When the agent returns, surface its verdict and findings without silently
rewriting them.
