# train-service doc map

Use this map to keep doc work small and targeted.

## Always read first

- `service/STATUS.md`: operational truth for current phase, open checkpoints, and post-alpha direction.
- `service/docs/alpha/MVP_ALPHA_PLAN.md`: canonical scope, gates, and rollout order.
- `service/docs/product/USE_CASES_AND_API_SURFACE.md`: supported and unsupported product/API surface.
- `service/docs/product/FLOWS_TELEGRAM_AND_WEB.md`: actual user-facing behavior and transport boundaries.

## Read when alpha release or live testing is involved

- `service/docs/alpha/ALPHA_USER_SCENARIOS.md`
- `service/docs/alpha/KNOWN_LIMITATIONS.md`
- `service/docs/alpha/CLOSED_ALPHA_RUNBOOK.md`
- `service/docs/alpha/STAGING_ROLLOUT_PLAN.md`
- `service/docs/alpha/TEST_STRATEGY.md`

## Read when architecture or contracts are involved

- `service/docs/architecture/SERVICE_STRUCTURE.md`
- `service/docs/architecture/PERSISTENCE_MODEL.md`
- `service/docs/architecture/PLANNER_RESPONSE_V2_RFC.md`

## Read when advisor scope is involved

- `service/docs/alpha/MVP_ALPHA_PLAN.md` post-alpha advisor section
- `service/docs/product/USE_CASES_AND_API_SURFACE.md` unsupported alpha API section
- `service/STATUS.md` advisor rollout summary

## Rule

If two docs define the same behavior, update both in the same change.
