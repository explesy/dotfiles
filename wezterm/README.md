# WezTerm

Конфиг лежит в [`.config/wezterm/wezterm.lua`](./.config/wezterm/wezterm.lua) и подключается через `stow wezterm`.

Активный путь в системе:

```sh
~/.config/wezterm/wezterm.lua
```

## Что настроено

- авто-старт в максимизированном окне (`wezterm.on("gui-startup", ...)`)
- цветовая схема `Afterglow (Gogh)`
- остальные параметры (шрифты, tabs, keys) — в `wezterm.lua`