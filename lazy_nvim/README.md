# lazy_nvim (Neovim)

Конфиг LazyVim в Colemak-раскладке лежит в [`.config/nvim/`](./.config/nvim) и подключается через `stow lazy_nvim`.

Активный путь в системе:

```sh
~/.config/nvim/
```

## Что есть

- база: [LazyVim](https://github.com/LazyVim/LazyVim)
- навигация по Colemak: `n` вниз, `e` вверх, `i` вправо, `h` влево (подробнее в [`.config/nvim/README.md`](./.config/nvim/README.md))
- локальные плагины в `lua/plugins/`: bufferline, Neo-tree, Snacks Picker, Tree-sitter, Sidekick CLI и др.
- extras: Python, TypeScript, Markdown, YAML, Docker, Yanky
- LazyVim 16.0.1; Neovim на этой машине 0.12.5
- документация в [`.config/nvim/docs/`](./.config/nvim/docs): RUNBOOK, CHANGELOG, TROUBLESHOOTING, PLUGIN_AUDIT, SESSION_CONTEXT, PERFORMANCE_BASELINE
- версии плагинов фиксируются в `lazy-lock.json`
