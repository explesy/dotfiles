# Migration rules

Use these rules for `service/backend/drizzle/`.

## Default posture

- Prefer additive migrations.
- Avoid destructive or shape-breaking changes during closed alpha readiness unless explicitly approved.
- Keep runtime code and migrations in sync in the same task.

## Required checks

- backend tests for touched persistence paths
- migration-path verification when a table or column shape changes
- docs sync if product-visible behavior or storage assumptions changed

## Operational rules

- Do not rely on personal/local-only data paths outside `service/`.
- Preserve existing data where practical; migration safety matters more than cleanup elegance.
- If a live/staging assumption changes, update runbook or rollout docs in the same task.
