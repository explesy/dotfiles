# Runbook

Operational checklist after any config change.

Note:
- Auto-install of missing plugins on startup is disabled.
- After adding/changing plugin specs, run `:Lazy sync` once before smoke tests.

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

## 2) Anti-Freeze Check

1. Open a compose file (`docker-compose.yml`).
2. Open a markdown file (`*.md`).
3. Open a lua file (`*.lua`).
4. Enter/exit insert mode several times in each file.
5. Run `:checkhealth`.
6. Review `:messages` for repeating callback errors.

Pass criteria:
- No hard crash/fallback.
- No freeze-like pause.
- No sustained CPU spike after insert-mode transitions.

## 3) Rollback Checklist (Risky Changes)

If regressions appear, revert the most recent risky change first:

1. YAML stack:
   - `lua/plugins/yaml.lua`
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

1. Run startup measurements (3 runs):
   - `nvim --startuptime /tmp/nvim-startup-1.log -u init.lua -i NONE +qa`
   - `nvim --startuptime /tmp/nvim-startup-2.log -u init.lua -i NONE +qa`
   - `nvim --startuptime /tmp/nvim-startup-3.log -u init.lua -i NONE +qa`
2. Extract totals with:
   - `awk '/NVIM STARTED/{line=$0} END{print line}' /tmp/nvim-startup-*.log`
3. Update `docs/PERFORMANCE_BASELINE.md` with the new numbers and main hotspots.
