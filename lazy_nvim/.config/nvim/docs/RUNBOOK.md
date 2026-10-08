# Runbook

Operational checklist after any config change.

Note:
- Auto-install of missing plugins on startup is disabled.
- Install new plugins with `:Lazy install`; restore locked versions with `:Lazy restore`.
- `:Lazy sync` also updates and cleans plugins; it is not a read-only check.

## 1) Smoke Check

1. Start Neovim normally.
2. Verify core navigation:
   - motion: `h n e i`
   - windows: `Ctrl+h`, `Ctrl+n`, `Ctrl+e`, `Ctrl+i`
3. Verify editing keys:
   - `t` / `T` enter insert modes
   - `nn` exits insert mode
   - `U` redo
4. Verify buffers and save:
   - `Shift+h` / `Shift+i` switch buffers
   - `Space a` writes file
5. Verify terminal behavior:
   - `Esc Esc` exits terminal insert
   - `Ctrl+h/n/e/i` switches windows
   - `Ctrl+/` closes terminal window
6. Verify file-navigation scenario (full chain):
   - open explorer: `Space e` (root) or `Space E` (cwd)
   - find file: `Space ff`
   - return via recent: `Space fr`
   - return via buffers: `Space fb` (or `Space ,`)
   - tree reveal sanity: `:Neotree reveal`

7. Verify Snacks normal-mode `n/e`, list `i` (preview), `t` (input), grep `Space sg` and projects `Space fp`.
8. Yank two different lines, paste, cycle `[y` / `]y`, then open history with `Space p`.
9. Verify `Space a` remains quick save and `Space /` remains terminal after Sidekick loads.
10. Open the desired AI CLI with `Space Ac/Ai/Ao`. Check the terminal before explicitly sending context.

## 2) Anti-Freeze Check

1. Open a compose file (`docker-compose.yml`).
2. Open a markdown file (`*.md`).
3. Open a lua file (`*.lua`).
4. Enter/exit insert mode several times in each file.
5. Verify attached LSP clients for YAML, Compose and Dockerfile with `:checkhealth vim.lsp`.
6. Introduce invalid YAML / Compose image type in a scratch copy and confirm diagnostics; check a Dockerfile hadolint warning.
7. Run `:checkhealth`.
8. Review `:messages` for repeating callback errors.

Pass criteria:
- No hard crash/fallback.
- No freeze-like pause.
- No sustained CPU spike after insert-mode transitions.

## 3) Rollback Checklist (Risky Changes)

If regressions appear, revert the most recent risky change first:

1. YAML stack:
   - disable `lang.yaml` / `lang.docker` in `lazyvim.json`, or temporarily set `yamlls.enabled = false` in a local spec
2. Tree-sitter/markdown stack:
   - `lua/plugins/treesitter.lua`
   - `lua/plugins/render-markdown.lua`
3. Autotag:
   - `lua/plugins/disable-ts-autotag.lua`
4. Provider and responsiveness toggles:
   - `lua/config/options.lua`
5. Key behavior regressions:
   - `lua/config/keymaps.lua`

After rollback:
1. Repeat Smoke Check.
2. Repeat Anti-Freeze Check.
3. Record the rollback reason in `docs/CHANGELOG.md`.

## 4) Performance Baseline Refresh

Policy:
- After any significant keymap or plugin/config change, always run 3 `--startuptime` measurements.

1. Run three serial measurements with the active Stow configuration, using a fresh log path each time:
   - `nvim --startuptime /tmp/nvim-startup-1.log -i NONE '+lua vim.defer_fn(function() vim.cmd("qa!") end, 300)'`
   - repeat with `startup-2.log` and `startup-3.log`.
2. Read the last `NVIM STARTED` line from each file individually. Neovim 0.12 may log both launcher and editor processes:
   - `for log in /tmp/nvim-startup-*.log; do awk '/NVIM STARTED/{line=$0} END{print FILENAME, line}' "$log"; done`
3. Update `docs/PERFORMANCE_BASELINE.md` with the new numbers and main hotspots.

## 5) Picker rollback

Set `vim.g.lazyvim_picker = "fzf"` in `lua/config/options.lua`, then `:Lazy install`
and restart. Keep `leader_slash.lua` scoped to Snacks; restore the optional fzf
`<leader>/` disable spec if testing shows it overrides the terminal key.
Neo-tree stays selected independently through `vim.g.lazyvim_explorer`.
Do not change `install_version` to switch backends.
