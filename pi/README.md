# Pi config

Глобальная конфигурация Pi хранится в `.config/pi/` и подключается через
`stow pi`. В shell экспортируется `PI_CODING_AGENT_DIR=$HOME/.config/pi`,
поэтому Pi использует XDG-путь вместо `~/.pi/agent`.

## Установка

Из корня репозитория:

```sh
mkdir -p "$HOME/.config/pi" "$HOME/.config/pi/npm"
stow pi
cd "$HOME/.config/pi/npm" && npm install
```

Команды `herdr integration install pi` и `herdr integration status` больше не
нужны для обычной работы Pi. Их можно использовать отдельно, если нужен Herdr
как терминальный мультиплексор, но дочерние задания Pi теперь запускаются через
`pi-subagents` внутри одной Pi-сессии.

`~/.config/pi` должна оставаться реальной директорией: Pi и его расширения
пишут туда сессии, модели, auth и runtime-состояние. Настройки из этого
пакета линкуются в неё отдельными файлами.

После `stow pi` в `~/.local/bin` появляется единственная команда `pi`. Каталог
уже находится раньше Homebrew в `$PATH`, поэтому новые shell-сессии используют
launcher автоматически. Pi запускается в доверенном режиме: permission system
автоматически разрешает действия со статусом `ask`, не показывая диалогов.
Явные запреты (`deny`) сохраняются — в частности, для `.env` и Pi credentials.

Launcher запускает subagents, Antigravity bridge, recap и workflow. Herdsman не
загружается, поэтому
запросы к Console Go не содержат несовместимые старые схемы `agent`, `chief` и
`staff`.
Для делегирования используется плоский инструмент `subagent`, а глубина вложенной
делегации ограничена одним уровнем.

## Короткие workflow-команды

Prompt templates лежат в `prompts/` и появляются в slash autocomplete:

- `/pl [focus]` — запустить независимый review текущего implementation plan через `plan-reviewer`;
- `/rv [focus]` — запустить независимый review текущей реализации через `reviewer`;
- `/sc [question]` — запустить узкое read-only исследование через `scout`;
- `/c [instruction]` — продолжить текущую задачу без повторного старта/перепланирования.

`/build [task]` — extension-команда, которая переключает текущую Pi-сессию на
`opencode-go/deepseek-v4.1-flash` и, если передан текст, сразу запускает его как
новый user turn. Короткий alias: `/b [task]`. Команда доступна только в базовом
`pi` и работает через тот же единственный launcher.

Примеры:

```text
/sc найди где формируется список subtitle tracks
/pl особенно проверь миграции и backward compatibility
/rv проверь race conditions и exceptional paths
/build реализуй утвержденный план
/c закончи оставшиеся тесты
```

После изменения prompt templates или `extensions/workflow.ts` используйте
`/reload` либо перезапустите Pi.

## Antigravity через `agy`

В launcher добавлен `@estebanforge/pi-antigravity-bridge`. Он подключает модели
через установленный и авторизованный официальный CLI `agy`, а не через отдельный
OAuth-токен внутри Pi. После перезапуска доступны модели провайдера
`antigravity`:

- `antigravity/gemini-3-8-flash`;
- `antigravity/gemini-3-7-flash`;
- `antigravity/gemini-3-6-flash`;
- `antigravity/gemini-3-1-pro`;
- `antigravity/claude-sonnet-4-6`;
- `antigravity/claude-opus-4-6-thinking`;
- `antigravity/gpt-oss-120b-medium`.

Выбор модели:

```text
/model antigravity/gemini-3-8-flash
```

Диагностика bridge выполняется командами `/agy status` и `/agy doctor`. После
обновления каталога моделей через `agy update` используйте `/reload` или
перезапустите Pi. Bridge по умолчанию запускает собственный закрытый tool loop
`agy`; его изменения файлов не проходят через обычный inline diff Pi. Команды
`agy` выполняются без отдельного подтверждения, поэтому не выбирайте
`accept-edits` для непроверенных репозиториев.

## Agent definitions

Пользовательские роли лежат в `agents/` и переопределяют одноимённые bundled-роли
`pi-subagents`:

- `scout` — `opencode-go/deepseek-v4-flash`, low thinking, read-only;
- `reviewer` — `opencode-go/deepseek-v4.1-flash`, medium thinking, read-only review +
  только read-only git через bash;
- `plan-reviewer` — `opencode-go/deepseek-v4.1-flash`, high thinking,
  независимый pre-implementation plan review.

Модели выбраны из текущего каталога и используют тот же `opencode-go`-маршрут,
что и основной workflow. Старые `opencode/*`-пины не использовались: для них в
локальной конфигурации нет API-ключа.

## Что хранится в Git

- `settings.json` — тема, модель по умолчанию и список пакетов;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
- `extensions/workflow.ts` — локальные workflow-команды, требующие поведения
  сложнее обычного prompt template;
- `.local/bin/pi` — единственный launcher Pi с permission system,
  `pi-subagents`, Antigravity bridge, recap и workflow;
- `agents/*.md` — пользовательские определения ролей `pi-subagents`;
- `prompts/*.md` — короткие slash workflow templates;
- `npm/package.json` и `npm/package-lock.json` — воспроизводимый список npm-зависимостей.

`auth.json`, `models-store.json`, `sessions/`, `pi-subagents/`,
`extensions/*/state`, `.agents/hooks.json` и `npm/node_modules/` остаются локальными и не должны
попадать в Git.

## Политика разрешений

Обычные чтение, поиск и редактирование внутри рабочего каталога разрешены
автоматически. `.env`, ключи, SSH-файлы и Pi credentials запрещены явно.
Остальные действия в доверенном режиме проходят без подтверждения, поэтому
не размещайте секреты в рабочем каталоге Pi.

Pi работает в доверенном режиме (`yoloMode: true`): все результаты `ask`
автоматически разрешаются, поэтому Bash, `node -e`, внешние запросы и изменения
файлов больше не требуют интерактивного подтверждения. Политика всё ещё важна
для явных `deny`: `.env`, ключи, SSH-файлы, npm/netrc credentials и Pi auth
остаются заблокированными. Это режим полного доверия к агенту в локальной
среде — он может выполнить в том числе `rm`, `git push` и сетевые операции.

## Subagents

Subagents — это единственный механизм дочерних Pi-сессий в текущей схеме.
Используйте существующие команды:

- `/sc [вопрос]` — read-only разведка через `scout`;
- `/pl [фокус]` — независимая проверка плана через `plan-reviewer`;
- `/rv [фокус]` — read-only ревью через `reviewer`.

`pi-subagents` запускает дочерние задания в текущем Pi-контексте, а не через
внешний мультиплексор. Глубина ограничена одним уровнем, поэтому scout/reviewer не смогут
самостоятельно породить цепочку новых агентов. Основной Pi сохраняет контроль
над архитектурой, изменениями и финальным решением.
