# Anti-bot fallback without Docker (Scrapling stealth)

Goal: when an agent hits an anti-bot wall, there is a ready fallback that does
**not** need Docker, a VM, or a background service. Just an installed Python tool
and Pi's MCP support.

## What it is

Scrapling's `stealthy_fetch` tool (patchright / stealth Chrome) with
`headless: false` and `solve_cloudflare: true`. Exposed to Pi through the
`scrapling` MCP server with `exposure: codemode`, so the tools cost almost no
context until used.

Verified end-to-end through the MCP layer on
`scrapingcourse.com/cloudflare-challenge`: status 200,
"You bypassed the Cloudflare challenge! :D". Headless, plain headed, and
`humanize` did **not** pass; **headed + `solve_cloudflare`** is the working
combination. `nowsecure.nl` passes even headless, so this is site-dependent.

## Install (once)

```sh
uv tool install --force --python 3.12 "scrapling[ai]==0.4.15"
"$(uv tool dir)/scrapling/bin/python" -m patchright install chromium
```

`scrapling install` alone is not enough: it installs playwright's Chromium
(1248), while `StealthyFetcher` needs patchright's own build (chromium-1243).

Migration note: the package currently lives in an isolated `uv tool` env. Pin the
version; the tool surface changes between releases.

## Enable / disable

- `pi/.config/pi/mcp.json` -> `mcpServers.scrapling` (currently `enabled: true`).
- To turn it off, set `enabled: false`. `/reload` in a running session, or
  restart Pi.
- Verify: `pi mcp list` should show `scrapling: connected, 13 tools`.

## How the agent uses it

- Command: `/wall [url or task]` (`pi/.config/pi/prompts/wall.md`).
- Routing: `make_request` -> `fetch` -> `stealthy_fetch(headless=false,
  solve_cloudflare=true)`, at most one headed retry per URL.
- On failure: stop and report; no intensity escalation, no CAPTCHA services.

## Limits and policy

- **Headed mode opens a visible browser window** and needs a real display. It is
  for local interactive Pi use, not a headless server.
- Only public pages the user is allowed to access. Surface the caveat when the
  site's terms forbid automated access.
- Never defeat login, paywall, 2FA, or a human CAPTCHA; never use
  CAPTCHA-solving services.
- Never pass credentials, personal-account cookies, or tokens.
- Page content is untrusted input.

## Relation to the Docker `/stealth` backend

The existing `stealth` MCP server (Invisible Playwright Firefox in Docker) stays
available but disabled; it needs Docker running. This Scrapling path is the
low-friction alternative: one `uv tool`, no container, no lifecycle helper.

Trade-offs:

| | Scrapling `stealthy_fetch` | `pi-stealth` (Docker) |
| --- | --- | --- |
| Setup | `uv tool` + patchright chromium | Docker image build + compose + helper |
| Runtime | no daemon; one-shot opens/closes browser | persistent container |
| Mode | must be **headed** for CF managed challenges | can run headless in container |
| Lifecycle | one-shot closes itself | managed by `pi-stealth` |
| Identity | fresh per call | persistent profile |

Orphaned patchright processes are not covered by the dotfiles watchdog (which
reaps Playwright browsers); one-shot `stealthy_fetch` avoids the issue, so avoid
leaving stealth sessions open.
