# Neovim Config Changelog

## 2026-03-11

### Plugin workflow audit (no dependency changes)
- Kept plugin dependencies unchanged (`lazyvim.json` and `lua/plugins/*` dependency set unchanged).
- Added `docs/PLUGIN_AUDIT.md` with keep/revisit statuses and explicit disable criteria.
- Added README section "Top 6 Navigation Flow" based on active keys (`neo-tree` + picker).
- Extended runbook with file-navigation chain validation and startup measurement policy.
- Extended performance baseline rules: always 3 runs after significant keymap/plugin-config changes.
- Changelog policy: include only changes that impact startup time or interactive latency.

### Documentation restructuring
- Removed one-off incident note file `docs/MARKDOWN_CRASH_FIX.md`.
- Added `docs/TROUBLESHOOTING.md` for stable issue/mitigation guidance.
- Added `docs/RUNBOOK.md` for post-change smoke/anti-freeze/rollback checks.
- Added `docs/PERFORMANCE_BASELINE.md` for repeatable startup tracking.
- Kept `README.md` focused on current usage and keymap behavior.

### Performance and maintenance cleanup
- Added `.nvimlog` to `.gitignore` to keep working tree clean.
- Reduced custom colorscheme surface to one active theme (`gruvbox-material`).
- Set `neo-tree` `use_libuv_file_watcher = false` for safer behavior on large repos.
- Disabled extra runtime plugins: `matchit`, `matchparen`, `netrwPlugin`.
- Disabled startup auto-install for missing plugins (`install.missing = false`) to avoid startup stalls in offline/restricted environments.
- Added startup metrics before/after cleanup to `docs/PERFORMANCE_BASELINE.md`.

### Stability and freeze fixes
- Disabled remote providers to avoid long/unstable health checks:
  - `vim.g.loaded_node_provider = 0`
  - `vim.g.loaded_perl_provider = 0`
  - `vim.g.loaded_python3_provider = 0`
  - `vim.g.loaded_ruby_provider = 0`
  - File: `lua/config/options.lua`
- Disabled `lazy.nvim` background update checker to reduce startup/background overhead.
  - File: `lua/config/lazy.lua`
- Disabled YAML LSP/schema stack because `docker-compose` buffers could feel stuck:
  - disabled `yamlls`
  - disabled `SchemaStore.nvim`
  - File: `lua/plugins/yaml.lua`
- Disabled `nvim-ts-autotag` after runtime callback error + 100% CPU freeze report.
  - File: `lua/plugins/disable-ts-autotag.lua`
- Removed custom monkey-patch of `vim.treesitter.start/get_parser` to avoid plugin callback loops.
  - File: `lua/config/options.lua`

### Tree-sitter restructuring
- Replaced multiple Tree-sitter override files with one consolidated config:
  - disabled `nvim-treesitter-textobjects`
  - disabled Tree-sitter features for unstable langs (`lua`, `markdown`, `markdown_inline`) in highlight/indent/folds
  - File: `lua/plugins/treesitter.lua`
- Removed old files:
  - `lua/plugins/disable-treesitter-textobjects.lua`
  - `lua/plugins/treesitter-lua.lua`
  - `lua/plugins/treesitter-markdown.lua`

### UI/UX performance and behavior
- Set active colorscheme to `gruvbox-material`.
- Marked alternative themes lazy-loaded to reduce startup load.
  - File: `lua/plugins/colorscheme.lua`
- Disabled `snacks` animations and tuned responsiveness:
  - `opt.timeoutlen = 200`
  - `opt.updatetime = 200`
  - File: `lua/config/options.lua`
- Improved `neo-tree` behavior:
  - `close_if_last_window = true`
  - `follow_current_file.enabled = true`
  - `use_libuv_file_watcher = false` (switched off later for safer behavior on large repos)
  - File: `lua/plugins/neo-tree.lua`

### Keymaps cleanup (conflict reduction)
- Removed conflicting single-key insert entry on `l/L`.
- Added safer insert entry on `<leader>l` / `<leader>L`.
- Temporarily changed right-window navigation from `<C-i>` to `<C-l>` (to avoid jumplist/tab conflicts).
- Restored right-window navigation back to `<C-i>` for Colemak workflow.
- Removed quick save on `<leader>a` (reserved namespace).
- Moved completion toggle to `<leader>uM` (avoid `<leader>uC` conflict with colorscheme pickers).
- Removed notify spam in completion toggle.
- Restored insert entry on `t/T` for Colemak workflow.
- Restored quick save on `<leader>a` (`Space a`).
  - File: `lua/config/keymaps.lua`

### LazyVim extras
- Removed `lazyvim.plugins.extras.ai.supermaven`.
  - File: `lazyvim.json`
