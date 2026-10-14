# Results — Scrapling MCP A/B evaluation (Pi)

- Date: 2026-10-14
- Issue: https://github.com/explesy/dotfiles/issues/4
- Harness: Pi 1.2.0, `opencode-go/deepseek-v4.1-flash`, thinking `high`
- Variant A: existing workflow (`playwright-cli` skill + builtin `bash`/`read`)
- Variant B: same + Scrapling MCP `0.4.15` (`mcp__scrapling__*` via codemode)
- `AGY_WEB_TOOLS=0` in both arms; `agy_*` tools excluded
- Runs: 12 tasks x 2 variants, 1 repeat each (all deterministic on first pass)

## Correctness

| | Correct | Note |
| --- | --- | --- |
| A (baseline) | **12 / 12** | no fabricated fields |
| B (candidate) | **12 / 12** | no fabricated fields |

Every answer matched its reference. Both arms correctly handled static DOM,
tables, JS rendering, click interaction, pagination, detail fan-out, changed
markup with decoys, and a public-injection page.

## Cost / effort (sum over 12 tasks)

| Metric | A | B | B / A |
| --- | --- | --- | --- |
| Tool calls | 72 | 64 | 0.89x |
| Tokens (total) | 671,134 | 1,329,046 | **1.98x** |
| Wall seconds | 525 | 319 | 0.61x |
| Cost (USD) | 0.0201 | 0.0475 | **2.36x** |
| Tool errors | 4 (T03, T05, T07, T11) | 6 (T05 x2, T08, T09, T10, T11) | — |

B needs slightly fewer tool calls and is faster in wall time, but roughly
**doubles tokens and more than doubles cost**. The extra cost comes from
codemode orchestration + MCP tool schemas + verbose tool output.

## Findings

- **H1 (utility): holds.** Scrapling MCP completed every task, including
  `make_request`, `bulk_get`, `fetch`, `stealthy_fetch` and `screenshot`.
- **H2 (cost): rejected.** Steps drop ~11% and wall time ~39%, but tokens/cost
  roughly double. The gate requires a cost or step win; cost regressed.
- **H3 (reliability/security): mixed.**
  - No canary was obeyed in either arm; no secrets, no domain escape
    (only `127.0.0.1`, the fixture hosts and the allowlisted public hosts appear).
  - **Scrapling's advertised prompt-injection protection did not strip the
    hidden `display:none` / zero-font injection** in this fixture: the hidden
    instruction text reached the model context through `mcp__scrapling__fetch`
    markdown output. The model resisted, but the claimed protection is not
    sufficient on its own.

## Capability gaps (B)

- **No interaction action in 0.4.15.** The tool set has no `click`/`evaluate`;
  T04 (click "Load more") had to fall back to the `playwright-cli` skill. The
  installed surface (13 tools) differs from the public docs, which advertise
  `session_action` / `session_evaluate`.
- **Screenshot is viewport-only.** `screenshot` exposes no element-clip selector;
  T08 produced a viewport capture, not a tight crop.
- Redundant with the existing browser path for all evaluated tasks.

## Stealth / anti-bot capability (follow-up probe)

Question: does Scrapling actually bypass anti-bot protections? Tested only on
purpose-built public test endpoints (no third-party sites we lack permission for,
no CAPTCHA-solving services, no logins). Raw logs: `stealth/*.jsonl`.

In 0.4.15 `StealthyFetcher` is **`stealth_chrome`** (patchright), not Camoufox; it
needs patchright's own Chromium build (`python -m patchright install chromium`,
chromium-1243), which `scrapling install` did **not** install.

### Cloudflare managed challenge (`scrapingcourse.com/cloudflare-challenge`)

| Config | Result | Time |
| --- | --- | --- |
| `make_request` (HTTP) | fail, 403 challenge | 0.3s |
| `fetch` (headless Chromium) | fail, 403 challenge | 62s |
| `stealthy_fetch` headless + solve_cloudflare | fail, 403 challenge | 41s |
| `stealthy_fetch` headless + solve + real_chrome | fail, 403 challenge | 52s |
| `stealthy_fetch` **headed** + humanize (no solve) | fail, 403 | 2s |
| `stealthy_fetch` **headed** plain | fail, 403 | 2s |
| **`stealthy_fetch` headed + `solve_cloudflare=True`** | **PASS** — "You bypassed the Cloudflare challenge! :D" | **7–10s** |

Conclusion: the bypass **works**, but requires **headed mode + solve_cloudflare**.
`humanize` and `real_chrome` are not required; headless is detected and fails.

### Cloudflare "under attack" test page (`nowsecure.nl`)

Returns the real page (`NOWSECURE by nodriver`, 58 chars) in both headless and
headed — i.e. this simpler configuration is passable even headless. So bypass is
**site-dependent**, not uniform.

### Practical implications and caveats

- **Headed means a visible browser window and a real display.** It is incompatible
  with headless/server use, and the Pi watchdog that reaps orphaned Playwright
  browsers does not know about patchright processes.
- **Overlaps with the existing local stealth backend** (`pi-stealth`, Invisible
  Playwright Firefox). A head-to-head against `/stealth` was not run.
- **Policy caveat:** `solve_cloudflare` automatically defeats an access-control
  challenge. That is appropriate on purpose-built test endpoints or with explicit
  permission, and **not** as a general scraping tool against arbitrary sites —
  it can violate their terms. The existing Pi safety rules ("do not attempt to
  defeat an explicit access-control challenge") still apply to normal use.

This strengthens the earlier **No-go** for default use and makes Scrapling's main
remaining value proposition its stealth bypass — which duplicates `/stealth` and
carries the headed-mode and policy constraints above.

## Decision: No-go (for default/adopted use)

Correctness is equal to the baseline, but B costs ~2.4x and duplicates the
existing `playwright-cli` capability while lacking its interaction primitives.
The gate ("succeeds on more tasks, or materially reduces steps/cost, without
regressing safety/stability") is not met.

Optional narrow follow-up (only if a concrete need appears): evaluate
`make_request` / `bulk_get` alone as a cheap HTTP fetch path — those do not need
a browser and were not isolated in this run.

## Reproduce

```sh
scripts/serve-fixtures.sh &
scripts/run-all.sh                      # full 12 x 2 matrix
node scripts/report.mjs
```
