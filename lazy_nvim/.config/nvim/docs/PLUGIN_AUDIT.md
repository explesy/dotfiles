# Plugin Audit

Updated 2026-10-08: explicit Snacks Picker + Neo-tree; language extras and CLI-only Sidekick.

| Plugin | Why it exists | Invoke (key/command) | Status |
|---|---|---|---|
| `nvim-neo-tree/neo-tree.nvim` | Main file explorer for project navigation | `Space e`, `Space E` | `keep` |
| `folke/snacks.nvim` | File/buffer/recent/grep picker and terminal | `Space ff/fr/fb/sg`, `Space /` | `keep` |
| `gbprod/yanky.nvim` | Yank history and paste cycling | `Space p`, `[y`, `]y` | `keep` |
| `folke/sidekick.nvim` | AI CLI terminals, NES disabled | `Space A…` | `keep` |
| `SchemaStore.nvim` | Local YAML schema catalog | YAML LSP startup | `keep` |
| `folke/flash.nvim` | Fast in-buffer jumps/motions | `s`, `S`, `r` | `keep` |
| `lewis6991/gitsigns.nvim` | Hunk-level git workflow in buffers | `[h`, `]h`, `Space gh*` | `keep` |
| `folke/noice.nvim` | Better cmdline/messages UX | automatic (`VeryLazy`) | `keep` |
| `akinsho/bufferline.nvim` | Buffer switching visibility | `Shift+h`, `Shift+i` | `keep` |
| `folke/trouble.nvim` | Diagnostics/symbols list UI | `Space xx`, `Space cS` | `revisit` — disable if not used for 2 weeks |
| `MagicDuck/grug-far.nvim` | Project-wide search/replace | `Space sr`, `:GrugFar` | `revisit` — disable if not used for 2 weeks |
| `folke/todo-comments.nvim` | TODO/FIX navigation | `Space st`, `Space sT` | `revisit` — disable if not used for 2 weeks |
| `venv-selector.nvim` | Python virtualenv switching | `:VenvSelect` | `keep` |
| `nvim-lspconfig` (+ Python extras) | LSP and language support | automatic on filetype | `keep` |
| `conform.nvim` + Black extra | Formatting workflow for Python | format key / formatter on demand | `keep` |

## Revisit Rules

- Revisit cadence: once per 2 weeks.
- Action on `revisit`: if plugin key/command was unused for the period, mark for disable in next cleanup pass.
- Safety gate: disable one `revisit` plugin at a time, then run `docs/RUNBOOK.md` smoke + anti-freeze checks.

Telescope and fzf-lua were removed from the active spec and lockfile. Existing
unused plugin directories are retained; no `Lazy clean` was performed.
