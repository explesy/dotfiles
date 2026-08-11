---
name: ui
description: Run evidence-based visual acceptance for a UI change. Use when the user asks to verify a rendered page, responsive layout, browser behaviour, or UI readiness before handoff or commit. Do not use for backend-only or documentation-only changes.
---

# UI acceptance

Read the repository `AGENTS.md` before choosing checks. Treat its visual gate as mandatory when it applies.

## Workflow

1. Identify the affected routes, user-visible states, and whether validation is local, preview, or production. Do not present local evidence as production evidence.
2. Use the browser tool required by repository instructions. If no repository rule exists, choose one primary tool: `Browser` for ordinary page checks, `Chrome` for an existing user session, `Playwright` for reproducible automated checks, and `Computer Use` only for desktop-app actions.
3. Exercise every viewport, route, and edge state required by the repository. When there is no explicit gate, test the smallest representative set and say what was not covered.
4. Inspect the rendered result for overflow, clipping, overlap, broken grids, cramped controls, weak contrast, layout shift, and loading, empty, and error states relevant to the change.
5. Capture concrete evidence: route, viewport, tool, observed result, and limitations. A successful build, HTTP 200, open iframe, or outer-page screenshot alone is not proof of an external playback result.

## Scope and handoff

- Preserve the user's requested scope. If the user asked only for a review, report defects without changing files.
- If implementation is authorized, make the smallest focused fix and repeat the affected visual checks.
- Report passed checks, confirmed defects, fixes if any, and remaining verification limits. Do not claim full UI coverage when only selected routes were inspected.
