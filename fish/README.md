# fish

Конфиг лежит в [`.config/fish/`](./.config/fish/config.fish) и подключается через `stow fish`.

Активный путь в системе:

```sh
~/.config/fish/config.fish
```

## Что настроено

- `fish_greeting` отключено, `EDITOR=nvim`, `PATH` дополнен `/opt/homebrew/bin` и `~/.local/bin`
- аббревиатуры: `ls` -> `eza`, `ll` -> `eza -la --sort=type`, `lg` -> `lazygit`, `ld` -> `lazydocker`, `dcu`/`dcd` -> `docker compose up/down`, `clr` -> `clear`, `v` -> `nvim .`, `buu` -> `brew update; and brew upgrade`
- функции: `yy` (запуск yazi с переходом в его последнюю папку), `c` (копирование вывода в буфер обмена)
- интеграции `eza` и `zoxide` в [`.config/fish/conf.d/`](./.config/fish/conf.d)
- `fish_variables` в git не отслеживается (см. корневой `.gitignore`)