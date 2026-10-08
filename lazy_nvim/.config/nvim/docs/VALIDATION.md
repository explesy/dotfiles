# Configuration validation — 2026-10-08

Active config: `~/.config/nvim` resolves to this Stow module.
Neovim: 0.12.5. LazyVim: tag 16.0.1, commit `999700997f72227187d49d8b92667183dc7fc809`.
Only LazyVim was updated among existing plugin commits; new SchemaStore,
Sidekick and Yanky commits are recorded in `lazy-lock.json`.

## Functional evidence

Ten smoke checks passed in an actual TUI process controlled through Neovim RPC:

- Explicit Snacks picker, Neo-tree explorer; no active Telescope/fzf-lua specs.
- Colemak motions, `t/T`, `nn`, undo/redo, buffer switching and quick save.
- Lua and Markdown parser/highlighter active; 15 insert transitions per file without callback errors.
- Files picker returns results; normal-mode `n/e` move its list down/up.
- Grep returns the expected fixture match; buffers/recent pickers return results.
- Neo-tree reveal and local Colemak mappings.
- Yank history records different lines; paste/cycling and Snacks history picker work.
- Sidekick detects Pi, Codex and OpenCode; NES disabled, Copilot not enabled.
- No repeated callback errors in messages.

Seven language checks passed using temporary fixtures, including:

- YAML, Compose and Docker LSP attachment and real supported LSP requests.
- Invalid YAML produces syntax diagnostics.
- Invalid Compose image type produces a Compose Specification schema diagnostic.
- Dockerfile `FROM alpine:latest` produces hadolint `DL3007`.
- No language callback errors in messages.

Additional RPC checks confirmed terminal stdout, `Space /` opening the configured
Fish terminal, `Esc Esc` reaching terminal normal mode, and all four Colemak window directions.
Sidekick terminals ran actual `pi --help`, `codex --version` (0.160.1), and
`opencode --version` (2.0.20). Smoke overrides used a shell to keep output visible;
the persisted configuration uses the built-in tool definitions.
No model prompt, remote authentication or AI response was tested.

Hadolint 2.15.1 was installed via Homebrew after Mason's GitHub asset download stalled.
The config prefers an executable on PATH; YAML/Docker servers were installed via Mason.

## Health and limits

Full `:checkhealth` completed after UI initialization and loading the relevant plugins.
LazyVim/Tree-sitter CLI, picker, terminal, completion and loaded LSP setup passed.
Remaining reports concern intentionally absent Copilot LSP for CLI-only Sidekick,
optional AI binaries, optional Mason language runtimes, disabled Snacks components,
image/PDF/LaTeX/Mermaid rendering dependencies and normal which-key prefix overlaps.
Image rendering is disabled and was not enabled to clear these reports.
A headless check before UI initialization produces additional misleading Snacks setup errors;
the TUI health result is the relevant evidence.

Short fixture tests cannot establish long-term freedom from the historical freezes.
Lua indent/folds, textobjects, render-markdown and autotag mitigations remain in place.
SchemaStore supplies a local catalog; schema documents may still use the network.
Neo-tree remains selected so a second explorer migration can be evaluated after ordinary use.

Three serial startup measurements: 69.287 / 37.615 / 34.438 ms. See
[PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) for method and interpretation.
Lua formatting and `git diff --check` passed. Temporary fixtures, smoke scripts,
logs and the original config snapshot are in `/tmp/lazyvim-review-20261008/`;
these are diagnostic artifacts and can be lost on reboot.
