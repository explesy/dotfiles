---
name: simplify
description: Perform one focused low-cost simplification pass over the current diff without editing files.
---

Use exactly one bounded read-only Luna scout (or the cheapest equivalent available) to inspect the current working-tree diff and recently changed files for simplifications. Do not edit files.

Look only for concrete dead code, redundant abstractions, over-engineering, awkward control flow, unnecessary indirection, or defensive code for impossible cases. Ignore style preferences handled by formatters/linters.

Return a prioritized list with file:line, what can be removed/collapsed, why it is safe, and roughly how the diff gets smaller. If the current diff is already minimal, say so explicitly. Do not launch a second review pass.
