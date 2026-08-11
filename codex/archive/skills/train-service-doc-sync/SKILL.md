---
name: "train-service-doc-sync"
description: "Use when the user asks to update, review, or sync documentation for /Users/doc/notes/train-service/service, especially STATUS, alpha plan, product flows, API surface, rollout docs, and advisor scope. Check for drift between docs and the current alpha contour, return findings first for review tasks, and run pnpm check-docs after doc edits."
---

# train-service Doc Sync

Use this skill for documentation work inside `/Users/doc/notes/train-service/service`.

## Start here

Read these files first:
- `service/STATUS.md`
- `service/docs/alpha/MVP_ALPHA_PLAN.md`
- `service/docs/product/USE_CASES_AND_API_SURFACE.md`
- `service/docs/product/FLOWS_TELEGRAM_AND_WEB.md`

Then pull in only the extra docs needed for the task. Use [references/doc_map.md](references/doc_map.md) to choose them.

## What to enforce

- Docs must not promise more than the current alpha contour.
- `STATUS.md` and `MVP_ALPHA_PLAN.md` stay aligned on what is open now versus post-alpha.
- Supported alpha API and user flows stay aligned with known limitations and runbook language.
- Advisor docs stay clearly post-alpha unless the repo explicitly moves that boundary.

## Editing workflow

1. Find the smallest source-of-truth set for the task.
2. Update all docs that define the same behavior or scope boundary.
3. Re-read the updated docs together to catch contradictions.
4. Run `cd /Users/doc/notes/train-service/service && pnpm check-docs`.

## Review workflow

When the user asks for a review:
1. Return findings first, ordered by severity.
2. Call out doc drift, conflicting promises, missing operator guidance, and stale alpha boundaries.
3. Keep summary short and secondary.

## Output expectations

- For review-only tasks: findings first.
- For edit tasks: summarize what was synchronized and what remains intentionally out of scope.
