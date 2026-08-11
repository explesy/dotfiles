# MCP Inventory And Runbook

Дата: 2026-08-12

## Назначение

Этот файл — канонический inventory и краткий runbook по MCP для локального `Codex app`.

Он отвечает на четыре вопроса:

1. Что сейчас подключено
2. Для чего это нужно
3. Какие ограничения и риски есть
4. Как правильно добавлять новые MCP без потери конфигурации

## Текущий inventory

### `MCP_DOCKER`

Тип:

- gateway

Текущее состояние:

- выключен (`enabled = false`), так как Docker используется редко;
- конфигурация сохранена и не требует удаления.

Назначение:

- проксирует Docker MCP catalog;
- дает доступ к каталогам и дополнительным MCP без ручного описания каждого из них в `config.toml`.

Когда использовать:

- для экспериментов;
- для редких MCP;
- когда надо быстро проверить новый сервер из каталога.

Примечание:

- при временном включении gateway внутри него также будет `playwright`.

### `ssh-laptop`

Тип:

- remote command MCP

Назначение:

- выполнение команд на удаленной машине через SSH.

Типовые сценарии:

- `airsrv`;
- docker/systemd/runtime диагностика;
- серверные проверки и ручные операции.

### `notes-fs`

Тип:

- filesystem MCP

Scope:

- `/Users/doc/notes`

Назначение:

- локальная работа с файлами, деревьями каталогов, поиском по содержимому и точечным редактированием.

Текущее состояние:

- `ALLOW_WRITE=true`
- `ENABLE_ROOTS=false`

Почему так:

- `notes` — основной рабочий data/code corpus;
- отдельный scope безопаснее, чем давать filesystem MCP всю домашнюю директорию.

### `notes-git`

Тип:

- git MCP

Scope:

- `/Users/doc/notes`

Назначение:

- смотреть состояние локальных репозиториев;
- делать `status`, `diff`, `log`, `show`, ветки и базовые commit-операции.

### `context7`

Тип:

- docs MCP

Назначение:

- package-first доступ к актуальной внешней документации.

Лучшие сценарии:

- `FastAPI`
- `aiogram`
- `React`
- `Vite`
- `TypeScript`
- `SQLAlchemy`

### `atlas-docs`

Тип:

- docs MCP

Назначение:

- docs index/search по библиотекам и фреймворкам;
- полезен как второй слой рядом с `context7`.

Логика:

- `context7` лучше, когда знаешь библиотеку;
- `atlas-docs` лучше, когда нужен docs-catalog и навигация по страницам.

### `myshows-db`

Тип:

- database MCP

Scope:

- SQLite база `/Users/doc/notes/series/data/myshows_watch_history.db`

Назначение:

- SQL и natural-language запросы к watch history;
- просмотр схемы;
- ad-hoc аналитика без отдельных временных скриптов.

### `playwright`

Тип:

- browser automation MCP

Назначение:

- локальные UI smoke/regression проверки;
- скриншоты страниц;
- DOM snapshot, network, console, scripted browser interactions.

Почему подключен отдельно:

- `playwright` уже живет и внутри `MCP_DOCKER`, но отдельный custom server лучше виден в UI `Codex app`;
- это удобнее для постоянного use-case, чем держать его только за gateway.

### `github`

Тип:

- GitHub MCP с существующей локальной авторизацией.

Назначение:

- работа с репозиториями, pull request и issue без нового PAT в `config.toml`.

### `zenmoney`

Текущее состояние:

- временно выключен.

Причина:

- токен больше не хранится в plaintext-конфиге; после перевыпуска он должен
  находиться в login Keychain под сервисом `codex.zenmoney.token`.

## Что не подключено

### Новые экспериментальные Docker MCP

Не держите Docker gateway включённым ради потенциально полезных серверов. Когда появится конкретный сценарий, включите `MCP_DOCKER` на время задачи, проверьте scope, env vars и доступы, затем снова выключите его. Постоянно нужный сервер лучше вынести в отдельный именованный custom MCP с минимальным доступом.

## Где хранится конфигурация

Источник истины:

- `codex/config.toml` в этом репозитории; `~/.codex/config.toml` — симлинк на
  него.

Неактивные project-specific интеграции:

- `codex/archive/mcp/project-integrations.toml`;
- `codex/archive/skills/`.

Проверка:

- `codex mcp list`

Дополнительный слой Docker catalog:

- `docker mcp server ls` — только после временного включения `MCP_DOCKER` и запуска Docker Desktop.

## Runbook: добавление нового MCP

### 1. Сначала проверить сервер

Для Docker catalog MCP:

- `docker mcp server inspect <name>`

Нужно выяснить:

- docker image;
- обязательные env vars;
- volume mounts;
- нужен ли auth;
- это одноразовый инструмент или постоянный.

### 2. Решить, куда его ставить

Вариант A:

- оставить за `MCP_DOCKER`, если это редкий или экспериментальный сервер

Вариант B:

- вынести в отдельный custom server, если он нужен часто, должен быть виден в UI или имеет фиксированный scope

### 3. Добавлять только последовательно

Важно:

- `codex mcp add` нельзя гонять параллельно на несколько серверов;
- при параллельной записи можно потерять часть секций в `~/.codex/config.toml`.

Безопасная схема:

1. `codex mcp add <name> -- ...`
2. проверить `codex mcp list`
3. при необходимости открыть `~/.codex/config.toml`
4. только потом добавлять следующий сервер

### 4. После изменения конфига

Нужно:

- полностью перезапустить `Codex app`

Почему:

- UI custom servers может не перечитывать `config.toml` на лету;
- `Refresh` на странице MCP не гарантирует reload custom config.

## Выбор browser-инструмента

1. `Browser` — обычная проверка локальных и веб-страниц.
2. `Chrome` — когда нужна существующая пользовательская сессия или расширение.
3. `playwright` — воспроизводимые UI smoke/regression-проверки.
4. `Computer Use` — только операции в macOS-приложениях, которые не покрывает браузер.

Не запускайте несколько браузерных путей ради одного и того же доказательства. Второй инструмент нужен только при отсутствии доступа в первом или для независимого подтверждения.

## Runbook: примеры команд

### Переустановить `notes-fs` writable

```bash
codex mcp remove notes-fs
codex mcp add notes-fs -- docker run -i --rm \
  -e ENABLE_ROOTS=false \
  -e ALLOW_WRITE=true \
  -v /Users/doc/notes:/Users/doc/notes \
  mcp/rust-mcp-filesystem /Users/doc/notes
```

### Добавить `playwright` как custom server

```bash
codex mcp add playwright -- docker run -i --rm mcp/playwright
```

### Добавить `atlas-docs`

```bash
codex mcp add atlas-docs \
  --env ATLAS_API_URL=https://atlas.cartograph.app/api \
  -- docker run -i --rm -e ATLAS_API_URL mcp/atlas-docs
```

### Добавить GitHub official MCP

Нужен реальный PAT:

```bash
codex mcp add github-official \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=<YOUR_TOKEN> \
  -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN \
  ghcr.io/github/github-mcp-server
```

## Принцип именования

Название должно сразу отвечать на вопрос "что это и к чему привязано".

Хорошие примеры:

- `notes-fs`
- `notes-git`
- `myshows-db`

Плохие примеры:

- `fs2`
- `db`
- `tooling`

## Минимальный operational checklist

После любого изменения MCP-стека:

1. `codex mcp list`
2. проверить `~/.codex/config.toml`
3. при необходимости проверить `docker mcp server ls`
4. перезапустить `Codex app`
5. открыть `Settings -> MCP servers` и убедиться, что UI показывает ожидаемый список
