---
description: Create a well-structured git commit
agent: build
subtask: true
---

Look at the current `git status` and `git diff`. Stage relevant files manually (no `git add -A` / `git add .` — list files explicitly). Hard rules:

- Never stage `*.env`, `*.env.*`, `id_rsa`, `*.pem`, `*.key`, or anything in `.gitignore` unless the user explicitly says so.
- Never stage build artefacts (`dist/`, `build/`, `node_modules/`, `*.tsbuildinfo`, `__pycache__/`, `target/`).
- Never stage large binaries or generated files.

Write a conventional commit message that explains WHY, not just what. Subject ≤ 72 chars, imperative mood. Body explains the user-visible or operational change and the non-obvious trade-offs.

Do **not** push. Report the resulting commit hash and a one-line summary of the staged files.
