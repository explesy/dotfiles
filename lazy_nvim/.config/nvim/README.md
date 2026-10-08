# LazyVim Colemak Config

Base: [LazyVim](https://github.com/LazyVim/LazyVim)  
Docs: [lazyvim.github.io/installation](https://lazyvim.github.io/installation)

## Main Navigation

Colemak motion keys (normal/visual):
- `n` -> down (`j` / `gj`)
- `e` -> up (`k` / `gk`)
- `i` -> right (`l`)
- `h` stays left

Search result navigation:
- `k` -> next search result
- `K` -> previous search result

Paragraph navigation:
- `E` -> previous paragraph (`{`)
- `N` -> next paragraph (`}`)

## Window / Panel Navigation

Normal mode:
- `Ctrl+h` -> left window
- `Ctrl+n` -> lower window
- `Ctrl+e` -> upper window
- `Ctrl+i` -> right window

Terminal mode:
- `Esc Esc` -> terminal normal mode
- `Ctrl+h` / `Ctrl+n` / `Ctrl+e` / `Ctrl+i` -> move between windows
- `Ctrl+/` -> close terminal window

Note: `Ctrl+i` can be interpreted as `Tab` in some terminals. In this config it is intentionally used for right-window navigation for Colemak ergonomics.

## Editing and Buffers

- `t` -> enter insert mode (`i`)
- `T` -> insert at beginning of line (`I`)
- `nn` in insert mode -> `<Esc>`
- `U` -> redo
- `Alt+n` / `Alt+e` -> move line/selection down/up
- `Shift+h` / `Shift+i` -> previous/next buffer

## Quick Actions

- `Space a` -> quick save (`:w`)
- `Space uM` -> toggle completion in current buffer
- `Space /` -> terminal
- `Space sg` -> grep in root dir
- `Space sG` -> grep in current cwd

## Top 6 Navigation Flow

1. Open explorer (project root): `Space e`
2. Open explorer (current cwd): `Space E`
3. Find file fast (root): `Space ff` (or `Space Space`)
4. Jump to recent files: `Space fr`
5. Jump to open buffers list: `Space fb` (or `Space ,`)
6. Switch between “project contexts”:
   - primary: `Space E` (cwd explorer)
   - `Space fp`: projects picker

## Picker, History and AI CLI

Snacks is the explicit picker backend; Neo-tree remains the explorer for this stage.
`install_version = 7` records installation history and is intentionally preserved.
LazyVim is pinned to 16.0.1; plugin commits are recorded in `lazy-lock.json`.

- Picker normal mode: `n` down, `e` up; in the list `i` focuses preview, `t` returns to input.
- Picker insert mode: type your query normally; use arrows or `Ctrl+n` / `Ctrl+p` to select results.
- `Space p`: yank history; `[y` / `]y`: cycle previous/next paste.
- `Space Ac` / `Space Ai` / `Space Ao`: Codex / Pi / OpenCode terminal.
- `Space As`: select an installed AI CLI; `Space Ad`: close it.
- `Space Af`: send file context; visual `Space Av`: send selection; `Space Ap`: choose a prompt.

AI context is sent only when you invoke these actions. Sidekick NES is disabled;
Copilot LSP is not configured. CLI authentication and model access use each CLI's
existing configuration. Sidekick terminals use Colemak window navigation too.
The CLI-only spec intentionally avoids the stock AI extra's `<leader>a` and Tab mappings.

YAML and Docker use the official language extras. `compose.yml`, `compose.yaml`,
`docker-compose.yml` and `docker-compose.yaml` get the Compose filetype explicitly.
SchemaStore's catalog is local; individual schema URLs can still require network access.
`hadolint` uses an existing executable when available (on this Mac: Homebrew),
otherwise the Docker extra requests installation through Mason.

## Current Stability Profile

Current defaults prioritize stability and responsiveness:
- Disabled external providers: node/perl/python/ruby
- Disabled `nvim-ts-autotag`
- Disabled `render-markdown.nvim`
- Disabled Tree-sitter textobjects plugin
- Enabled YAML/Compose/Docker LSP and SchemaStore catalog
- Lua Tree-sitter highlighting enabled; Lua indent/folds remain disabled
- Disabled `snacks` animations
- Disabled startup auto-install for missing plugins (`lazy.install.missing = false`).

If you add a plugin, run `:Lazy install`. To reproduce the checked plugin versions,
run `:Lazy restore`. `:Lazy sync` also updates plugins and cleans unused installations;
use it only when you intend those changes.

## Documentation Map

- [Validation](docs/VALIDATION.md): latest functional checks, health results and limitations.

- [Runbook](docs/RUNBOOK.md): post-change operational checks (smoke, anti-freeze, rollback).
- [Troubleshooting](docs/TROUBLESHOOTING.md): recurring problems, root causes, mitigations, re-enable order.
- [Performance Baseline](docs/PERFORMANCE_BASELINE.md): startup measurements and current hotspots.
- [Plugin Audit](docs/PLUGIN_AUDIT.md): keep/revisit table for current plugin set.
- [Changelog](docs/CHANGELOG.md): chronological history of changes.
