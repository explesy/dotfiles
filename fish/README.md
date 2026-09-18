# fish

Конфиг лежит в [`.config/fish/`](./.config/fish/config.fish) и подключается через `stow fish`.

Активный путь в системе:

```sh
~/.config/fish/config.fish
```

## Что настроено

- **Окружение и пути:** `fish_greeting` отключено, `EDITOR=nvim`, `PATH` собирается через `fish_add_path` (`/opt/homebrew/bin`, `~/.local/bin`, `~/.docker/bin`, `~/.bun/bin`, `~/.antigravity/antigravity/bin`, `~/.cache/lm-studio/bin`) — пути заданы относительно `$HOME`, без хардкода пользователя.
- **Аббревиатуры CLI:**
  - `ls` -> `eza`, `ll` -> `eza -la --sort=type`
  - `lg` -> `lazygit`, `ld` -> `lazydocker`
  - `dcu` / `dcd` -> `docker compose up` / `down`
  - `v` -> `nvim .`, `clr` -> `clear`
  - `bu` -> `brew update`, `buu` -> `brew update; and brew upgrade`
  - `ag` -> `agy`, `agc` -> `agy --continue`, `agp` -> `agy --mode plan` (Antigravity CLI)
- **Функции:**
  - `yy` — запуск `yazi` с автоматическим переходом (`cd`) в последнюю открытую папку.
  - `c` — копирование вывода любой команды в буфер обмена (`command $argv | pbcopy`).
- **Интеграции:**
  - `starship` и `zoxide` инициализируются при запуске интерактивной сессии.
  - Конфиги `eza` и `zoxide` в [`.config/fish/conf.d/`](./.config/fish/conf.d).
  - Автодополнение OpenClaw из `~/.openclaw/completions/openclaw.fish`.
  - Оптимизации OpenCode (`OPENCODE_FAST_BOOT`, отключение внешних fetch/autoupdate).
- `fish_variables` в git не отслеживается (см. корневой `.gitignore`).