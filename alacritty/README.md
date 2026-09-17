# Alacritty

Конфиг лежит в [`.config/alacritty/alacritty.toml`](./.config/alacritty/alacritty.toml) и подключается через `stow alacritty`.

Активный путь в системе:

```sh
~/.config/alacritty/alacritty.toml
```

## Что настроено

- окно без декораций (`decorations = "None"`), старт в максимизированном режиме
- шрифт `monospace` 10pt
- `TERM` выставляется в `xterm-256color`
- цвета — схема `Gruvbox Dark`
- формат конфигурации: современный TOML (`alacritty.toml`)