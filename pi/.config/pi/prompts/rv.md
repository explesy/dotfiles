---
description: Review the current implementation with the reviewer agent
argument-hint: "[focus]"
---

Use the `reviewer` agent now. Do not perform the independent review yourself
before delegation.

Give it the current task, intended behavior, relevant working-tree state, and
enough repository context to review the actual implementation.

Additional focus from me:
${ARGUMENTS:-No additional focus.}

Return blocking findings first, then important non-blocking findings. If the
reviewer finds no meaningful issue, say that clearly.
