---
description: Escalate the current problem to GPT-5.6 Terra high reasoning with explicit parent-context handoff
---

This command is an explicit request to run exactly one GPT-5.6 Terra hard review of the CURRENT problem from the parent session.

Do not perform the escalation review yourself first. The `hard-review` subagent starts with a fresh child context and cannot see this conversation, so construct a self-contained handoff before delegating.

The handoff MUST begin with:

`RUN_HARD_REVIEW: true`

Then include:

`CURRENT PROBLEM:`
- The exact bug, design question, failed behavior, or unresolved risk being investigated now.

`ATTEMPTED SOLUTION OR CURRENT HYPOTHESIS:`
- The solution, implementation, diagnosis, or reasoning currently under review.
- If there is no attempted solution yet, state that explicitly and give the current hypothesis instead.

`CURRENT DECISIONS AND CONSTRAINTS:`
- Material requirements, accepted trade-offs, compatibility constraints, or user decisions from this session.

`RELEVANT CODE CONTEXT:`
- Known relevant files, symbols, call paths, changed files, and concrete evidence from the current session.
- Do not paste a large git diff; the reviewer can inspect the working-tree diff independently.

`UNRESOLVED QUESTION:`
- State exactly what you want Terra to independently validate, challenge, or resolve.

If CURRENT PROBLEM or ATTEMPTED SOLUTION/CURRENT HYPOTHESIS cannot be recovered unambiguously from the current session, do not guess from the repository. Report insufficient context instead of delegating a misleading review.

Delegate the completed handoff exactly once to `hard-review`.

After the reviewer returns:
- verify that its `REVIEW_SCOPE` matches the current problem;
- ignore findings that clearly belong to another task;
- summarize only material additions, disagreements, or confirmed risks;
- do not modify files unless the user's current request separately asks for implementation.
