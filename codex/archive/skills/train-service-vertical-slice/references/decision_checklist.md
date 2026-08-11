# Vertical slice decision checklist

For any non-trivial `service/` task, check these in order.

## Contracts

- Does the task add or change a runtime entity?
- If yes, does `service/shared/schemas/` need a schema update first?
- Do boundary payloads still match the canonical schema version?

## Persistence and backend

- Does the change affect persisted state, validation, audit, or tenancy?
- Does the API surface or route contract need to change?
- Is there still a deterministic path for the critical behavior?

## Bot and web

- Does Telegram behavior change?
- Does any stateful bot flow or web review path need an update?
- Is companion UI still optional for alpha-critical tasks?

## Docs and fixtures

- Which docs define this behavior today?
- Do fixtures or demo payloads need extension to cover the new case?

## Checks

- Doc-only: `pnpm check-docs`
- Runtime behavior: targeted tests plus `pnpm alpha:gate`
- DB change: backend tests and migration-path verification

## Alpha impact

- Does this expand supported alpha scope?
- If yes, update `STATUS.md`, `MVP_ALPHA_PLAN.md`, and product docs together.
