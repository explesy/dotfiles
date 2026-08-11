---
name: "train-service-bot-flows"
description: "Use when changing train-service Telegram bot commands, grammY routing, session handling, keyboards, handoff logic, or stateful flows such as /start, /health, /import, /today, and /log."
---

# train-service Bot Flows

Use this skill for Telegram bot work in `service/bot`.

## Start here

Read:
- `service/bot/src/index.ts`
- `service/bot/src/session.ts`
- `service/bot/src/session-storage.ts`
- the touched command handlers

Then use [references/flow_priority.md](references/flow_priority.md) and [references/manual_bot_checks.md](references/manual_bot_checks.md).

## What to enforce

- Stateful flows have priority over generic text handling.
- `/import`, `/log`, and `/health` must not be hijacked by new free-text or advisor handlers.
- Bot changes preserve the Telegram-first alpha contour.
- Persistent session storage remains part of the design, not an afterthought.

## Workflow

1. Map entry points, active states, and exits for the touched flow.
2. Check whether the route should be command-only, alias-based, or explicit conversational entry.
3. Update backend client calls, keyboard behavior, and handoff semantics together.
4. Add transcript-level coverage or explicit manual test steps.

## Bot review output

For review tasks, call out:
- routing conflicts
- broken active-state precedence
- hidden assumptions about session state
- missing manual or transcript verification
