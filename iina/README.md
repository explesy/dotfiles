# IINA (macOS Media Player)

Конфигурация пользовательских горячих клавиш для плеера [IINA](https://iina.io/).

Конфиг лежит в [`Library/Application Support/com.colliderli.iina/input_conf/doc.conf`](./Library/Application%20Support/com.colliderli.iina/input_conf/doc.conf).

## Установка через Stow

```sh
stow iina
```

Активация схемы в настройках IINA через терминал:

```sh
defaults write com.colliderli.iina currentInputConfigName -string doc
```

## Ключевые бинды

- `Space` / `p` — пауза / воспроизведение
- `Right` / `Left` — перемотка на 5 секунд
- `Shift + Right` / `Shift + Left` — переход по субтитрам (+1 / -1 субтитр)
- `Alt + Right` / `Alt + Left` (`.` / `,`) — покадровый шаг вперёд / назад
- `m` / `Meta + /` — mute
- `Meta + [` / `Meta + ]` — изменение скорости воспроизведения (0.5x / 2.0x)
- `Alt + Meta + [` / `Alt + Meta + ]` — тонкая подстройка скорости (0.91x / 1.1x)
- `Meta + \` — сброс скорости в 1.0x
- `v` — скрыть / показать субтитры
- `Z` / `X` (`Alt + Z` / `Alt + X`) — задержка субтитров (шаг 0.5s / 0.1s), `C` — сброс
- `f` / `Ctrl + Meta + f` — полноэкранный режим
- `Meta + s` — скриншот
