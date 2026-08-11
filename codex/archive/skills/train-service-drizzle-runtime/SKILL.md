---
name: "train-service-drizzle-runtime"
description: "Use when changing train-service database schema, Drizzle migrations, persistence behavior, or runtime validation for backend entities such as plans, imports, workout logs, audit entries, and bot sessions."
---

# train-service Drizzle Runtime

Use this skill for database and persistence work in `service/backend`.

## Start here

Read:
- `service/backend/src/db/schema.ts`
- relevant files in `service/backend/drizzle/`
- relevant backend route and test files
- `service/docs/architecture/PERSISTENCE_MODEL.md` only for the touched entity

Use [references/db_touchpoints.md](references/db_touchpoints.md) and [references/migration_rules.md](references/migration_rules.md).

## What to enforce

- Tenant isolation stays explicit on every user-scoped query path.
- Persisted payloads stay aligned with canonical runtime contracts.
- Audit-critical mutations keep structured audit coverage.
- Migrations are backward-safe for closed alpha unless the task explicitly changes rollout assumptions.

## Workflow

1. Update Drizzle schema and route/test expectations together.
2. Prefer additive or safely transitional migrations.
3. Check whether docs or fixtures mention the touched persistence shape.
4. Run backend tests for touched persistence paths.

## Do not forget

- Session storage and workout logs are part of the alpha-critical path.
- A schema change without boundary validation or tests is incomplete.
