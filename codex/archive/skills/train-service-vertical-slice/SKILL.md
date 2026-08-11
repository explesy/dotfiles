---
name: "train-service-vertical-slice"
description: "Use when implementing or reviewing a feature in /Users/doc/notes/train-service/service that may cross contracts, backend, bot, web, fixtures, tests, and docs. Enforce contracts first, deterministic core first, and service-local boundaries."
---

# train-service Vertical Slice

Use this skill for feature work in `service/`.

## Core rules

- Start from `service/AGENTS.md` and preserve its architecture rules.
- Treat `service/shared/` as the owner of contracts and domain rules.
- Keep `service/backend`, `service/bot`, and `service/web` as orchestration and transport layers.
- Do not add runtime dependence on personal markdown in `data/`.
- Do not let AI become the source of truth for safety or state transitions.

## Workflow

1. Identify whether the task changes an entity, a flow, or only a transport surface.
2. If a new entity or field appears, update schemas/contracts first.
3. Trace the full path: persistence, backend route, bot/web transport, docs, fixtures, tests.
4. Update only the affected surfaces, but do not stop early if downstream docs or tests would drift.
5. Run the smallest relevant checks, then `pnpm alpha:gate` if runtime behavior changed materially.

Use [references/decision_checklist.md](references/decision_checklist.md) as the implementation checklist.

## Special focus

- Imported plan remains a first-class scenario.
- Telegram-first remains the alpha contour unless the repo explicitly changes that.
- Deterministic fallback and safety behavior matter more than AI polish.
