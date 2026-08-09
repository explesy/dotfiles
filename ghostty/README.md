# Ghostty

Конфиг лежит в [`.config/ghostty/config`](./.config/ghostty/config) и подключается через `stow ghostty`.

Активный путь в системе:

```sh
~/.config/ghostty/config
```

## Что настроено

- шрифт 16pt, окно максимизировано, без декораций
- `shell-integration = fish`
- `macos-option-as-alt = left` (Option — как Alt для Zellij/readline, правая Option остаётся для macOS)
- локальные переопределения подхватываются через `config-file = "?config.local"` (не в git)
- часть `cmd+...` комбинаций разблокирована, чтобы не конфликтовать с Zellij