# DB touchpoints

Focus on the tables that sit on the alpha path and on advisor prerequisites.

## Alpha-critical tables

- `athlete_profiles`: canonical profile payloads
- `health_constraints`: safety input
- `plan_imports`: imported-plan review and adoption
- `plans`: active adopted plan state
- `workout_logs`: deterministic `today -> log -> next today`
- `bot_sessions`: grammY persistent session state
- `audit_log`: mutation trace for core user-scoped changes

## High-risk invariants

- `external_accounts` uniqueness on provider + provider user id
- every `/v1/me/**` path must remain tenant-scoped
- adopted plans remain valid canonical `plan.v1` payloads
- workout logs preserve plan/session linkage when available
- bot sessions survive process restarts

## Advisor-adjacent future touchpoints

- conversation storage
- provider/runtime metadata
- proposal/apply audit trail

Do not invent these tables early unless the task is explicitly about advisor rollout.
