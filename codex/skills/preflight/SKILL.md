---
name: preflight
description: Assess whether a repository change is ready for release or deployment without pushing, deploying, or changing production. Use when the user asks for preflight, release readiness, deployment readiness, or a final evidence-based go/no-go check.
---

# Release preflight

Prepare an evidence-based readiness decision. Never push, deploy, modify production, rotate secrets, or perform external writes as part of this skill.

## Workflow

1. Read the repository `AGENTS.md`, release documentation, and relevant package or task configuration. Identify mandatory checks before running them.
2. Inspect `git status`, current branch, and the focused diff. Separate task files from pre-existing unrelated changes; do not stage or modify either set.
3. Identify affected surfaces: application code, UI, migrations or data, configuration and secrets, documentation, dependencies, and external services.
4. Run the smallest set of required, relevant checks. If UI changed, run the repository visual gate or invoke the `ui` workflow. If migrations or data changed, inspect the migration history and use safe local or copied-data validation before considering any production action.
5. For external systems, distinguish configuration inspection, local validation, and fresh live proof. Do not treat a passing build, HTTP 200, or iframe shell as proof of deployed behaviour.

## Decision

- Return one of: `ready for the explicitly named next step`, `not ready`, or `partially verified`.
- List the exact evidence collected, baseline failures kept separate, missing checks, and the smallest next action. State when an explicit user approval is still required for push, deploy, data mutation, purchase, or other external change.
- Do not turn a preflight into a release. A positive result authorizes no external action by itself.
