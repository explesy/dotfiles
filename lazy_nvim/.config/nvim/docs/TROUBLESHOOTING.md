# Troubleshooting

This file tracks recurring issues and stable mitigations for this Neovim config.
For routine validation after changes, use [RUNBOOK.md](RUNBOOK.md).

## 1) Markdown/Lua crash or sudden exit

Symptom:
- Opening `*.md` (and sometimes `*.lua`) may crash/fallback.

Confirmed cause:
- Unstable Tree-sitter integration in this setup, especially around markdown queries/textobjects.

Current mitigations:
- `nvim-treesitter-textobjects` disabled in `lua/plugins/treesitter.lua`.
- Tree-sitter `highlight/indent/folds` disabled for `lua`, `markdown`, `markdown_inline` in `lua/plugins/treesitter.lua`.
- `render-markdown.nvim` disabled in `lua/plugins/render-markdown.lua`.

Why kept disabled:
- This combination previously caused hard crashes and unstable behavior.

How to re-enable safely:
1. Re-enable one component only (never multiple at once).
2. Start with Tree-sitter language feature for a single language.
3. Re-test markdown/lua editing before the next step.
4. Re-enable `render-markdown.nvim` only after base Tree-sitter is stable.

What to verify after each step:
- `:checkhealth` completes.
- Opening markdown/lua does not crash.
- No repeated Tree-sitter callback errors in `:messages`.

## 2) `docker-compose.yml` feels frozen or very slow

Symptom:
- YAML buffers (especially compose files) lag, block, or feel stuck.

Confirmed cause:
- `yamlls` + remote schema handling (`SchemaStore`) increased overhead in this environment.

Current mitigations:
- `yamlls` disabled in `lua/plugins/yaml.lua`.
- `SchemaStore.nvim` disabled in `lua/plugins/yaml.lua`.

Why kept disabled:
- Better responsiveness and fewer freeze-like pauses in compose files.

How to re-enable safely:
1. Re-enable `yamlls` first, keep SchemaStore disabled.
2. Test real compose files.
3. Re-enable SchemaStore only if step 2 is stable.

What to verify after each step:
- Open/save/edit `docker-compose.yml` without stalls.
- CPU stays normal when entering/exiting insert mode.

## 3) High CPU / freeze after insert-mode transitions

Symptom:
- CPU spikes to 100% after entering/leaving insert mode.

Confirmed cause:
- Callback-loop behavior linked to `nvim-ts-autotag` in this setup.

Current mitigation:
- `nvim-ts-autotag` disabled in `lua/plugins/disable-ts-autotag.lua`.

Why kept disabled:
- Prevent known high-CPU loops and editor freeze.

How to re-enable safely:
1. Enable only `nvim-ts-autotag`.
2. Re-test insert/normal transitions in HTML/JS/TS-like files.

What to verify:
- No persistent CPU spike.
- No repeated callback errors.

## 4) `:checkhealth` or startup feels blocked

Symptom:
- Startup or health checks are unexpectedly slow.

Confirmed cause:
- Provider detection for missing hosts (node/python/ruby/perl) can add blocking checks.

Current mitigation:
- Providers disabled in `lua/config/options.lua`:
  - `vim.g.loaded_node_provider = 0`
  - `vim.g.loaded_perl_provider = 0`
  - `vim.g.loaded_python3_provider = 0`
  - `vim.g.loaded_ruby_provider = 0`

Why kept disabled:
- Faster startup and fewer false "freeze" impressions.

How to re-enable safely:
1. Re-enable one provider only if needed.
2. Confirm host executable is installed first.

What to verify:
- Startup remains responsive.
- `:checkhealth` does not regress.

## 5) New plugin does not appear after config edit

Symptom:
- Added plugin spec, but plugin is not installed/loaded on next startup.

Confirmed cause:
- Startup auto-install is intentionally disabled (`install.missing = false` in `lua/config/lazy.lua`).

Current behavior:
- Missing plugins are not installed during startup.

What to do:
1. Run `:Lazy sync` after plugin-spec changes.
2. Restart Neovim.

What to verify:
- Plugin appears in `:Lazy`.
- Feature/keymaps from that plugin are active.

## Safe Re-enable Order (One by One)

1. `yamlls`
2. `SchemaStore.nvim`
3. Tree-sitter language features (smallest scope first)
4. `render-markdown.nvim`
5. `nvim-ts-autotag` (last)
