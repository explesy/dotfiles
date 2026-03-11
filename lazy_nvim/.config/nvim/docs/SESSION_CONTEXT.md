# Neovim Session Context (2026-03-11)

## Why this file exists
This is a recovery/context snapshot to quickly resume debugging and configuration work after interruptions.

## Initial symptoms reported
- `nvim` often froze on startup or during `:checkhealth`.
- Freeze when opening `docker-compose.yml`.
- After entering insert mode and leaving it, editor could freeze.
- In freeze state, Neovim used 100% CPU.

## Key evidence
- User provided screenshot: Lua callback error from `nvim-ts-autotag` stack.
- This strongly matched high-CPU loop behavior from repeated callback failures.

## Main root-cause candidates and actions taken
1. Provider health and external host probing
- Issue: provider checks can block/slow when host dependencies are absent.
- Action: disabled node/python/ruby/perl providers in `lua/config/options.lua`.

2. Heavy YAML stack on compose files
- Issue: YAML LSP + SchemaStore can stall or feel stuck on compose files.
- Action: disabled `yamlls` and `SchemaStore.nvim` in `lua/plugins/yaml.lua`.

3. Tree-sitter integration instability in this setup
- Earlier config had aggressive monkey-patches of `vim.treesitter.*`.
- Action:
  - moved to safer per-language disable list in `lua/plugins/treesitter.lua`
  - removed API monkey-patching from `lua/config/options.lua`
  - disabled `nvim-treesitter-textobjects`

4. Autotag callback loop / high CPU
- Action: disabled `windwp/nvim-ts-autotag` in `lua/plugins/disable-ts-autotag.lua`.

5. Keymap conflicts causing unpredictable behavior
- Removed problematic single-key insert mapping on `l/L`.
- Restored Colemak-friendly insert entry on `t/T`.
- Temporarily replaced `<C-i>` window-right with `<C-l>` to avoid jumplist/tab conflicts.
- Later restored `<C-i>` window-right for Colemak ergonomics.
- Moved completion toggle to `<leader>uM`.

## Current important config state
- Colorscheme baseline: `gruvbox-material`.
- `lazy.nvim` checker disabled.
- `lazy.nvim` startup auto-install disabled (`install.missing = false`).
- `snacks` animations disabled.
- `timeoutlen=200`, `updatetime=200`.
- `supermaven` extra removed from `lazyvim.json`.

## Files most relevant for future debugging
- `lua/config/options.lua`
- `lua/config/keymaps.lua`
- `lua/config/lazy.lua`
- `lua/plugins/treesitter.lua`
- `lua/plugins/yaml.lua`
- `lua/plugins/disable-ts-autotag.lua`
- `lua/plugins/colorscheme.lua`
- `docs/CHANGELOG.md`
- `docs/TROUBLESHOOTING.md`
- `docs/RUNBOOK.md`
- `docs/PERFORMANCE_BASELINE.md`

## Quick sanity checklist when resuming later
1. Launch `nvim` normally in the problematic project directory.
2. Open `docker-compose.yml` and verify no freeze.
3. Enter/leave insert mode and verify no CPU spike.
4. Run `:checkhealth` and verify it completes.
5. If freeze returns, capture:
   - screenshot of exact popup/error
   - `:messages` output after restart
   - `top`/`htop` process snapshot

## Rollback hints (if needed)
- Re-enable YAML LSP by removing/adjusting `lua/plugins/yaml.lua`.
- Re-enable autotag by deleting `lua/plugins/disable-ts-autotag.lua`.
- Re-enable provider detection by removing `loaded_*_provider` flags in `options.lua`.
