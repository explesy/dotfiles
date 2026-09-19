---
description: Investigate a focused question with the scout agent
argument-hint: "[question]"
---

Use the `scout` agent now for a focused read-only investigation.

Question:
${ARGUMENTS:-Inspect the code relevant to the current task and identify the files, call paths, contracts, tests, and constraints needed for the next step.}

Keep the assignment narrow. Return the scout's concise handoff and do not
re-scan the same repository areas yourself unless its evidence is insufficient.
