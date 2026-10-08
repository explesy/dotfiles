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
- Lua Tree-sitter indent/folds remain disabled; Lua highlighting was restored on 2026-10-08.
- Markdown highlighting is enabled; Snacks quickfile still excludes Markdown to avoid its early highlighting path.
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

Current configuration (2026-10-08):
- Official `lang.yaml` and `lang.docker` extras enabled; old YAML disable spec removed.
- Built-in remote SchemaStore catalog disabled by the YAML extra; SchemaStore.nvim supplies the catalog locally.
- Schema documents can still be downloaded from their URLs. This is not a fully offline schema setup.
- Explicit Compose filename detection ensures the Compose language service attaches.

If lag returns, disable `yamlls` alone first and repeat the compose editing check.
Keep evidence of the affected file, server logs and delay before changing another component.
Previous freeze attribution is historical; it does not establish the cause of a new delay.

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
1. Run `:Lazy install` for new plugins or `:Lazy restore` for locked versions.
2. Restart Neovim.

What to verify:
- Plugin appears in `:Lazy`.
- Feature/keymaps from that plugin are active.

## Safe Re-enable Order (Remaining Mitigations)

YAML/SchemaStore and Lua highlighting were restored on 2026-10-08.
After longer interactive use, evaluate one remaining component at a time:

1. Lua Tree-sitter indent/folds (separately)
2. `nvim-treesitter-textobjects`
3. `render-markdown.nvim`
4. `nvim-ts-autotag` (last)

## 6) Docker tools and CLI-only health warnings

On this Mac hadolint is installed with `brew install hadolint` because the GitHub
release-asset download used by Mason stalled. The Docker override skips Mason's
hadolint download when a working executable is on PATH. Other Docker/YAML servers
remain managed by Mason. Verify actual diagnostics, not just package directories.

Sidekick's health checker reports missing Copilot LSP even with `nes.enabled = false`.
This is expected for this CLI-only configuration; do not enable Copilot just to clear it.
AI CLI authentication/model requests must be checked separately from terminal startup.
