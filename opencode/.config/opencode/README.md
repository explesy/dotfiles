# OpenCode config — free-only V2 (Oct 2026)

Canonical global OpenCode V2 config for this dotfiles repository. From the repo root, `stow opencode` links `opencode/.config/opencode/` into `~/.config/opencode/` and `opencode/.local/bin/` into `~/.local/bin/`.

The package is intentionally minimal: one free multimodal build worker, one free read-only reviewer, and the normal safety/context controls. OpenCode Go access is authenticated, but no paid route is configured for now: the free build worker covers everyday work.

## Install

`~/.config/opencode` must be a real directory (not a single stow-folder symlink) because generated files such as `cli.json`, `node_modules` and `bun.lock` can live there at runtime. Create it **before** stowing so stow links the entries individually:

```sh
mkdir -p ~/.config/opencode
stow opencode
```

No `npm install` is needed: the config ships without plugin packages.

## Structure

```text
opencode.jsonc
cli.json
tui.json          # legacy V1 file, kept only for one-time CLI migration
herdr-tui-session.js

agents/
  reviewer.md

commands/
  c.md
  do.md
  review.md
  simplify.md
  commit.md

tui-plugins/
  workflow-ui.tsx
```

`opencode/.local/bin/opencode-reset` is a separate stow entry: it lands in `~/.local/bin` and wipes the runtime database, state and caches (see [Fresh start](#fresh-start)).

## Fresh start

`opencode-reset` stops the background service, deletes `~/.local/share/opencode` (database, sessions, logs, snapshots), `~/.local/state/opencode` and `~/.cache/opencode`, then starts a fresh service. Your configuration and `auth.json` are preserved.

Run it from a plain shell, not from inside an OpenCode session — it stops the service that hosts that session:

```sh
opencode-reset            # confirm, wipe, start fresh
opencode-reset --dry-run  # show what would be deleted
opencode-reset --no-auth  # also drop saved credentials
```

Use it after a major upgrade (the client and the background service must run the same version) or whenever the local database has grown large or holds broken state. Per-session history can also be removed with the supported command instead of a full reset: `opencode session delete <session-id>`.

## Routing

Only two agents are enabled:

- `build` — **default**, `opencode/deepseek-v4.1-flash-free#high`.
  - Free, no provider credentials required.
  - Text and image input, tool calls, and reasoning variants (`low`, `high`, `max`).
  - 200k context window and 32k output, which is enough for normal coding sessions.
  - Handles frontend/design feedback, screenshots, diagrams, and visual debugging directly. There is no separate `design` or `vision` route any more.
- `reviewer` — subagent, `opencode/mimo-v2.6-flash-free`.
  - Free independent first-pass review after non-trivial changes.
  - Read-only: no edits, web access, external directories, or nested subagents.
  - Allowed `shell` commands are limited to `git status`, `git log`, `git diff`, and `git show`.

The built-in `plan`, `general`, and `explore` agents are disabled. The only subagent the build agent may launch is `reviewer`; this is enforced by the global `permissions` list.

Removed from the config because they duplicated this route, required paid credentials, or added routing clutter:

- `design` and `vision` — the free DeepSeek build model accepts images itself.
- `free-build` — merged into the default `build` route.
- custom `plan` and `quality` — they used paid GPT-5.6 Luna Go and were removed to keep routing minimal for now.
- `cheap-explore`, `coder`, `translator`, `plan-reviewer`, and `hard-review` subagents — they used paid or now-unnecessary models.
- commands `/lp`, `/pr`, `/ldo`, `/luna`, `/hard`, `/design`, and `/v` — they depended on the removed agents.

If a stronger route is needed later, `opencode-go/gpt-5.6-luna` (Go) is authenticated and can be reintroduced deliberately. Note that `openai/*` models currently have no route; the reachable strong reviewer model is `opencode/gpt-5.6-terra`.

## Commands

- `/c` — continue from the exact current state without redoing finished analysis.
- `/do` — implement the approved plan with the free `build` route.
- `/review` — free MiMo-V2.6 independent post-implementation review.
- `/simplify` — inspect recent changes for unnecessary complexity.
- `/commit` — stage relevant files and create a local conventional commit; never push.

## Native V2 configuration

`opencode.jsonc` uses the native V2 shape:

- `agents` (plural) with model variants joined as `provider/model#variant`;
- `permissions` as one ordered array, where the last matching rule wins;
- `update: "disable"` instead of the V1 `autoupdate`;
- `compaction.buffer` instead of the V1 `compaction.reserved`;
- `shell`, `watcher`, `formatter`, `share`, and `default_agent` unchanged where V2 keeps the same shape.

`lsp` was removed because V2 accepts it but does not run language servers or expose LSP diagnostics. Use the project's lint, typecheck, or compiler commands instead.

`cli.json` is the V2 terminal client configuration and loads both TUI plugins. `tui.json` is the legacy V1 file; V2 only reads it when `cli.json` is absent, so it is kept solely as a migration fallback.

## TUI workflow UI

`workflow-ui.tsx` is a TUI-only presentation layer. It does not duplicate command routing or change agent/model configuration. `cli.json` loads it explicitly from `./tui-plugins/workflow-ui.tsx`.

It adds:

- a compact `Focus` block at the top of the session sidebar with the current task and current activity;
- a compact status beside the session prompt, e.g. `BUILD · DeepSeek V4.1 Flash Free High · /wf`;
- `/workflow` (alias `/wf`) in the TUI command palette;
- a short command cheat sheet for `/do`, `/review`, `/c`, `/simplify`, and `/commit`;
- a small `/workflow commands` hint on the home prompt.

The UI only touches the TUI: terminal plugins are declared in `cli.json`, so they add no controls to OpenCode Desktop/Web.

## Safety / context controls

- secrets and private keys remain protected;
- destructive shell commands (`rm`, `sudo`, `git reset --hard`) and process kills still require approval;
- routine git operations, dependency installation, web research, and external directory access are autonomous;
- sharing remains disabled and update checks are turned off;
- automatic compaction keeps a reserved summary budget;
- watcher ignores keep generated directories out of the index;
- the reviewer remains read-only and cannot start nested subagents.

## Verify

```sh
opencode debug agents   # expect build + reviewer
opencode models         # expect the free DeepSeek and MiMo models
opencode service status
```
