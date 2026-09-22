---
name: hard
description: Escalate the current unresolved coding problem exactly once to GPT-6 Astra High for independent review.
---

Run exactly one escalation using the custom `hard-review` agent. Do not perform an expensive duplicate review in the parent first.

Construct a concise self-contained handoff beginning with `RUN_HARD_REVIEW: true` and containing:

`CURRENT PROBLEM:` exact bug, design question, failed behavior, or unresolved risk.

`ATTEMPTED SOLUTION OR CURRENT HYPOTHESIS:` current implementation/diagnosis/hypothesis.

`CURRENT DECISIONS AND CONSTRAINTS:` accepted requirements, trade-offs, compatibility and operational constraints.

`RELEVANT CODE CONTEXT:` known relevant files, symbols, call paths, changed files, and concrete evidence. Do not paste a large diff.

`UNRESOLVED QUESTION:` exactly what the escalation reviewer should validate, challenge, or resolve.

After the review, summarize only material additions, disagreements, confirmed risks, or the next decisive verification. Do not edit files unless the user's current request separately asks for implementation.
