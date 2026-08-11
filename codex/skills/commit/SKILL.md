---
name: commit
description: Create a focused local git commit from the current task without staging unrelated files or pushing.
---

Inspect current `git status` and focused `git diff`. Stage only files relevant to the current task, listing them explicitly rather than using `git add .` or `git add -A`.

Never stage secrets (`*.env`, `*.env.*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`), ignored files, build artifacts, dependency directories, large generated binaries, or unrelated working-tree changes unless the user explicitly asks.

Create a conventional commit whose subject is imperative and at most 72 characters. Explain why the change exists, not just what files changed. Do not push. Return the commit hash and a concise list of staged files.
