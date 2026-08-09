---
description: Find and propose simplifications in recent changes
agent: reviewer
subtask: true
---

Look at the current working tree diff and the recently changed files. Identify opportunities to simplify. Do not edit files.

Specifically look for:
- Dead code (unused exports, unreachable branches, stale comments)
- Redundant abstractions (wrapper functions that just forward, classes with one method, premature interfaces)
- Over-engineering (config for things that never change, generic helpers for one call site, plugin systems for one consumer)
- Awkward control flow (deep nesting, mixed return patterns, exceptions for control flow)
- Unnecessary indirection (re-exports, type aliases without a reason, dependency injection without polymorphism)
- Defensive code for cases that can't happen given the surrounding contract

Return a concrete, prioritised list. For each item: file:line, what to remove or collapse, why it's safe, and what the diff would shrink to in 1-2 lines. If the diff is already minimal, say so explicitly.
