# Zellij

Конфиг лежит в [`.config/zellij/config.kdl`](./.config/zellij/config.kdl) и подключается через `stow zellij`.

Активный путь в системе:

```sh
~/.config/zellij/config.kdl
```

## Что настроено

- `keybinds clear-defaults=true` — полностью переопределённые бинды (Colemak): `h/n/e/i` — фокус, `n` — новая панель, в tab-режиме `n`/`c` — новая вкладка и т.д.
- выход из режима через `Ctrl a`/`Ctrl g`
- тема и прочие опции — в файле (все секции прокомментированы)

Резервная копия от авто-обновления Zellij (`config.kdl.bak`) в git не отслеживается.