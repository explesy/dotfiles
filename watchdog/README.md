# watchdog

Reaps browser processes abandoned by crashed agent/Playwright sessions so a
leaked headless browser cannot spin a CPU core (and cook the laptop) for hours.

## What it kills

`reap-stale-browsers` only ever touches a process that is **both**:

1. an **automation browser** (its argv mentions `playwright`, or it carries
   `-juggler-pipe` / `--remote-debugging-pipe` / a headless browser binary), or
   a **Playwright CLI daemon** (`cliDaemon.js`); **and**
2. **provably abandoned**:
   - orphaned (`PPID 1`) for longer than `REAP_GRACE_SECS` (default 90 min), or
   - a Playwright daemon idling below 1 % CPU for longer than
     `REAP_DAEMON_MAX_SECS` (default 12 h).

Your normal Firefox / Chrome / Safari carries none of those flags, so it is
never matched. Children of a matched process are reaped with it (TERM, then
KILL after ~3 s).

## Why not just `playwright-cli kill-all`?

`kill-all` only knows about sessions the CLI itself manages. The real leak — a
Playwright-driver Firefox Nightly orphaned at `PPID 1` — was invisible to it
(`playwright-cli list` reported `(no browsers)`). This watchdog matches on the
process table instead, so it catches leaks from any launcher.

## Usage

```sh
reap-stale-browsers --dry-run              # show what would be killed
reap-stale-browsers                        # reap
reap-stale-browsers --check '<argv>'       # classify one command line, kill nothing
```

Tunables: `REAP_GRACE_SECS`, `REAP_DAEMON_MAX_SECS`, `REAP_LOG`.
Log: `~/Library/Logs/reap-stale-browsers.log`.

## Install (GNU Stow)

```sh
cd ~/dotfiles && stow watchdog
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.doc.reap-stale-browsers.plist
```

Runs every 15 min via `com.doc.reap-stale-browsers.plist`. To disable:

```sh
launchctl bootout gui/$(id -u)/com.doc.reap-stale-browsers
```
