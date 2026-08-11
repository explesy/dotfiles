---
name: "train-service-advisor-rollout"
description: "Use when designing or implementing the post-alpha conversational advisor in train-service, including context builder, provider layer, codex_auth, openai, deterministic fallback, proposals, preview/apply, and advisor-related docs."
---

# train-service Advisor Rollout

Use this skill for the post-alpha conversational advisor track.

## Start here

Read:
- `service/STATUS.md`
- `service/docs/alpha/MVP_ALPHA_PLAN.md`
- `service/docs/product/USE_CASES_AND_API_SURFACE.md`
- `service/docs/product/FLOWS_TELEGRAM_AND_WEB.md`

Then use [references/advisor_contracts.md](references/advisor_contracts.md) and [references/provider_policy.md](references/provider_policy.md).

## Hard rules

- Advisor is not the source of truth.
- Deterministic `/today`, `/log`, import/adopt, and safety logic remain authoritative.
- Plan-changing output must go through deterministic validation before preview/apply.
- Minimal context is enough for advisor MVP; do not smuggle in new input systems as hidden blockers.

## Implementation posture

- Prefer compact, selected user context over raw history.
- Keep provider abstraction on the backend boundary only.
- Treat `codex_auth` as dev/staging/manual only unless product policy explicitly changes.
- Do not mark a provider as supported without qualification gate coverage.

## Required sync

When advisor scope changes, re-check:
- `STATUS.md`
- `MVP_ALPHA_PLAN.md`
- product docs that define supported versus post-alpha behavior
