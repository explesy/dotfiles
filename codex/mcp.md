# MCP Inventory And Runbook

Дата: 2026-03-19

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

Назначение:

- проксирует Docker MCP catalog;
- дает доступ к каталогам и дополнительным MCP без ручного описания каждого из них в `config.toml`.

Когда использовать:

- для экспериментов;
- для редких MCP;
- когда надо быстро проверить новый сервер из каталога.

Примечание:

- внутри него сейчас отдельно включен `playwright`.

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

## Что не подключено

### GitHub MCP

Пока не подключен отдельно.

Что нужно:

- переменная окружения `GITHUB_PERSONAL_ACCESS_TOKEN`

Какой это ключ:

- это GitHub Personal Access Token;
- не OpenAI key;
- не SSH key;
- не OAuth токен из `Codex`.

Практическое правило:

- для read-only use-case достаточно токена с доступом к нужным репозиториям на чтение;
- для PR/issues/files/branch operations нужен токен с правами записи в нужные GitHub repositories.

Почему не подключен автоматически:

- локальный `Codex` auth сейчас содержит OpenAI auth, но не виден отдельный GitHub PAT;
- подставлять фиктивное значение в `config.toml` бессмысленно.

## Где хранится конфигурация

Источник истины:

- `~/.codex/config.toml`

Проверка:

- `codex mcp list`

Дополнительный слой Docker catalog:

- `docker mcp server ls`

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
