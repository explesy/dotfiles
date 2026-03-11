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

## Top 6 Navigation Flow

1. Open explorer (project root): `Space e`
2. Open explorer (current cwd): `Space E`
3. Find file fast (root): `Space ff` (or `Space Space`)
4. Jump to recent files: `Space fr`
5. Jump to open buffers list: `Space fb` (or `Space ,`)
6. Switch between “project contexts”:
   - primary: `Space E` (cwd explorer)
   - note: `<leader>fp` is not mapped in current extras profile

## Current Stability Profile

Current defaults prioritize stability and responsiveness:
- Disabled external providers: node/perl/python/ruby
- Disabled `nvim-ts-autotag`
- Disabled `render-markdown.nvim`
- Disabled Tree-sitter textobjects plugin
- Disabled YAML LSP (`yamlls`) and `SchemaStore.nvim`
- Disabled `snacks` animations
- Disabled startup auto-install for missing plugins (`lazy.install.missing = false`).

If you add a new plugin to the spec, run `:Lazy sync` once.

## Documentation Map

- [Runbook](docs/RUNBOOK.md): post-change operational checks (smoke, anti-freeze, rollback).
- [Troubleshooting](docs/TROUBLESHOOTING.md): recurring problems, root causes, mitigations, re-enable order.
- [Performance Baseline](docs/PERFORMANCE_BASELINE.md): startup measurements and current hotspots.
- [Plugin Audit](docs/PLUGIN_AUDIT.md): keep/revisit table for current plugin set.
- [Changelog](docs/CHANGELOG.md): chronological history of changes.
