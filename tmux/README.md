# tmux

Конфиг лежит в [`.tmux.conf`](./.tmux.conf) и подключается через `stow tmux`.

Активный путь в системе:

```sh
~/.tmux.conf
```

После свежей установки перечитать конфиг:

```sh
tmux source ~/.tmux.conf
```

## Что настроено

- `default-shell` = fish, mouse, нумерация окон/панелей с `1`
- префикс `C-a`, навигация по Colemak: `h` влево, `n` вниз, `e` вверх, `i` вправо
- ресайз панелей и сплиты: `|`/`-` (и `\`/`_` — флоат)
- `allow-passthrough on` (нужно Yazi для превью изображений)
- `update-environment` для `TERM*` — при новом подключении берётся внешний терминал
- восстановление сессий: `prefix + C-s` (save) / `prefix + C-r` (restore) через tmux-resurrect