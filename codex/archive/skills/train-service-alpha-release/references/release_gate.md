# Release gate

Use this order for closed alpha readiness work.

## Default sequence

1. `pnpm check-docs` if docs changed
2. targeted package tests for touched runtime areas
3. `pnpm alpha:gate`
4. runbook and status sync check
5. live smoke or manual checkpoint
6. go or no-go decision

## Extra checks by area

- DB or persistence changes: verify migration path and backend tests
- bot flow changes: transcript or live Telegram verification
- web flow changes: browser smoke when available
- rollout changes: staging plan and operator steps must be updated
