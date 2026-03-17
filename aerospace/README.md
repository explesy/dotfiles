# AeroSpace

Конфиг лежит в [`.config/aerospace/aerospace.toml`](./.config/aerospace/aerospace.toml) и подключается через `stow aerospace`.

Активный путь в системе:

```sh
~/.config/aerospace/aerospace.toml
```

Сейчас используется `key-mapping.preset = 'colemak'`, поэтому буквенные бинды в конфиге уже записаны под Colemak, а не под QWERTY.

## Что настроено

- `start-at-login = true`
- основной layout: `accordion`
- orientation: `auto`
- zero gaps
- `persistent-workspaces = [1, 2, 3, 4, 5, M]`
- mouse follows focused monitor
- скрытые через macOS приложения автоматически раскрываются обратно

## Карта воркспейсов

- `1` браузер
- `2` терминал
- `3` чаты
- `4` код
- `5` misc / web apps
- `M` музыка

## Автораскладка окон

Привязка сделана по `app-id`, а не по заголовкам окон. Это надёжнее и не ломается, когда приложение меняет title.

- Firefox -> `1`
- WezTerm -> `2`
- Telegram -> `3`
- Zed -> `4`
- Codex -> `4`
- ChatGPT Atlas -> `5`
- Spotify -> `M`

Посмотреть актуальные `app-id` можно так:

```sh
aerospace list-apps
```

## Бинды

Навигация сделана в Colemak-схеме `h / n / e / i`:

- `alt-h` focus left
- `alt-n` focus down
- `alt-e` focus up
- `alt-i` focus right

Перемещение окна:

- `alt-shift-h` move left
- `alt-shift-n` move down
- `alt-shift-e` move up
- `alt-shift-i` move right

Размер:

- `alt-minus` уменьшить
- `alt-equal` увеличить

Layout и fullscreen:

- `alt-slash` cycle `tiles`
- `alt-comma` cycle `accordion`
- `alt-f` AeroSpace fullscreen
- `alt-shift-f` macOS native fullscreen

Воркспейсы:

- `alt-1..5` перейти на `1..5`
- `alt-m` перейти на `M`
- `alt-shift-1..5` отправить окно на `1..5`
- `alt-shift-m` отправить окно на `M`
- `alt-tab` back-and-forth между воркспейсами
- `alt-shift-tab` перенести текущий воркспейс на следующий монитор

## Service mode

Вход:

- `alt-shift-backtick`

Команды в service mode:

- `esc` выйти
- `r` reload config
- `b` flatten workspace tree
- `f` toggle floating / tiling
- `backspace` close all windows but current
- `alt-shift-h / n / e / i` join with left / down / up / right

## Полезные команды

```sh
# перезагрузить конфиг
aerospace reload-config

# проверить список воркспейсов
aerospace list-workspaces --all

# посмотреть окна и их app-id/workspace
aerospace list-windows --all --format '%{app-name} | %{app-bundle-id} | %{window-title} | %{workspace}'
```

## Дальше можно добавить

- `workspace-to-monitor-force-assignment`, если появится второй монитор и захочется закрепить воркспейсы
- bar integration через `exec-on-workspace-change`
- отдельный resize mode, если захочется больше команд без модификаторов
