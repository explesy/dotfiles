---
name: "train-service-alpha-release"
description: "Use when preparing, reviewing, or executing closed-alpha readiness for train-service, including alpha gate checks, runbook alignment, smoke sequencing, staging rollout, observability, and go/no-go preparation."
---

# train-service Alpha Release

Use this skill for release-readiness work around the current closed alpha.

## Start here

Read:
- `service/STATUS.md`
- `service/docs/alpha/CLOSED_ALPHA_RUNBOOK.md`
- `service/docs/alpha/STAGING_ROLLOUT_PLAN.md`
- `service/docs/alpha/TEST_STRATEGY.md`
- `service/docs/alpha/KNOWN_LIMITATIONS.md`

Then use [references/release_gate.md](references/release_gate.md).

## What to enforce

- The alpha-critical path stays `start -> health -> import -> today -> log`.
- Release-impacting changes must keep docs, runbook, and status aligned.
- `pnpm alpha:gate` is the default release gate before live smoke.

## Workflow

1. Confirm current open checkpoints in `STATUS.md`.
2. Run or reference the required checks.
3. Verify manual smoke expectations and operator guidance.
4. Flag anything that expands scope during alpha readiness.

## Review output

Findings first for release reviews:
- blockers to live smoke
- missing operator steps
- missing observability or rollback guidance
- docs that overpromise versus current runtime
