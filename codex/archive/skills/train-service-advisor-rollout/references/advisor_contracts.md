# Advisor contracts and baseline

Use this as the minimum v1 advisor contract set.

## Minimal runtime entities

- `advisor_context`
- `advisor_chat_request`
- `advisor_chat_response`
- `advisor_proposal`

## Minimal context baseline

- profile
- goals
- active constraints
- active or imported plan
- recent workout logs

## Optional enrichment only if already productized

- readiness signals
- symptom capture
- recent accepted advice

## Plan-change rules

- no silent mutations
- structured proposal output, not free-text apply
- deterministic validation gate before preview/apply
- audit trail on apply or dismiss when persisted
