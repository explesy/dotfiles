# Visual Studio Code / Code

Конфиг лежит в [`.config/Code/User/settings.json`](./.config/Code/User/settings.json).

Активный путь в системе:

```sh
# Linux / macOS (symlink target through stow)
~/.config/Code/User/settings.json

# Альтернативный путь macOS (Application Support):
# ~/Library/Application Support/Code/User/settings.json
```

## Что настроено

- **Тема:** `Gruvbox Dark Hard` + `Monokai Pro Icons`
- **Шрифт:** `JetBrains Mono` 16pt, лигатуры включены
- **Vim-режим:** `vscodevim` с интеграцией Neovim (`vim.enableNeovim: true`) и системным буфером обмена
- **Редактор:** sticky scroll, bracket pair colorization, отключён minimap
- **Python:** линейки (rulers) на 79 и 120 символов, `formatOnType`, `inlayHints`
- **FZF Quick Open:** интеграция с `fd . -type d`
