# Pi config

Source of truth для конфигурации Pi — этот GitHub-репозиторий
`explesy/dotfiles`, каталог `pi/`. Старый Google Drive `OpenCode Config`
больше не используется и не должен считаться актуальным источником настроек.

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

Herdr больше не участвует в оркестрации Pi. Его можно использовать отдельно как
терминальный мультиплексор, а дочерние задания запускаются через
`pi-subagents` внутри одной Pi-сессии.

`~/.config/pi` должна оставаться реальной директорией: Pi и его расширения
пишут туда сессии, модели, auth и runtime-состояние. Настройки из этого
пакета линкуются в неё отдельными файлами.

После `stow pi` в `~/.local/bin` появляется единственная команда `pi`. Каталог
уже находится раньше Homebrew в `$PATH`, поэтому новые shell-сессии используют
launcher автоматически. Pi запускается в доверенном режиме: permission system
автоматически разрешает действия со статусом `ask`, не показывая диалогов.
Явные запреты (`deny`) сохраняются — в частности, для `.env`, ключей и
credentials.

Launcher запускает permission system, `pi-subagents`, Antigravity bridge, recap
и локальный workflow extension. Herdsman не загружается, поэтому запросы к
Console Go не содержат несовместимые старые схемы `agent`, `chief` и `staff`.
Для делегирования используется плоский инструмент `subagent`, а глубина
вложенной делегации ограничена одним уровнем.

## Короткие workflow-команды

- `/n [instruction]` — выполнить ровно одну следующую задачу из уже
  существующей GitHub execution queue: выбрать незаблокированную issue →
  реализовать → проверить → независимый cheap review для нетривиального diff →
  исправить существенные замечания → закрыть/сдвинуть существующую очередь,
  если критерии действительно выполнены. Команда сама переключает сессию на
  DeepSeek V4.1 Flash, `low`.
- `/i <issue> [instruction]` — выполнить одну конкретную GitHub issue тем же
  execution pipeline, не выбирая другую задачу. Принимает `/i 37` и
  `/i #37`; gated/blocked/closed issue не обходятся автоматически.
- `/p <task>` — автоматически: repository-aware plan → independent plan review →
  исправленный final plan; ручной `/pl` посередине не нужен;
- `/pl [focus]` — только независимый review уже существующего plan через
  `plan-reviewer`;
- `/rv [focus]` — независимый first-pass review текущей реализации через
  `reviewer`;
- `/sc [question]` — узкое read-only исследование через `scout`;
- `/c [instruction]` — продолжить текущую задачу без повторного
  старта/перепланирования.

Build-команды переключают текущую Pi-сессию на
`opencode-go/deepseek-v4.1-flash` и при наличии текста сразу запускают его как
новый user turn:

- `/build [task]` или `/b [task]` — DeepSeek V4.1 Flash, `low` thinking;
- `/bh [task]` — тот же DeepSeek V4.1 Flash, `high` thinking для действительно
  сложной реализации/отладки.

Примеры:

```text
/n
/n сначала проверь, что текущая issue не gated
/i 37
/i #37 сначала проверь backward compatibility
/p добавь кеширование результатов player probe
/sc найди где формируется список subtitle tracks
/pl особенно проверь миграции и backward compatibility
/b реализуй утвержденный план
/bh разберись с этой сложной race condition и реализуй исправление
/rv проверь exceptional paths и регрессии
/c исправь найденные blocking issues и закончи задачу
```

### Workflow status в footer

Execution-команды показывают короткий live status в footer, пока идёт
соответствующий запуск.

Для `/n` и `/i` extension регистрирует UI-only tool `workflow_status`.
Агент вызывает его только при крупных переходах workflow, поэтому footer
показывает не просто запущенную команду, а текущую issue и фазу:

```text
N · DeepSeek V4.1 Flash · low · selecting
N · DeepSeek V4.1 Flash · low · #42 · selected · Detect player languages
N · DeepSeek V4.1 Flash · low · #42 · implementing · Detect player languages
N · DeepSeek V4.1 Flash · low · #42 · testing · Detect player languages
N · DeepSeek V4.1 Flash · low · #42 · reviewing · Detect player languages
N · DeepSeek V4.1 Flash · low · #42 · fixing · Detect player languages
```

Поддерживаемые фазы: `selecting`, `selected`, `investigating`, `planning`,
`implementing`, `testing`, `reviewing`, `fixing`, `finishing`,
`blocked`. Для `/i 37` номер известен сразу; для `/n` номер и короткий title
появляются после выбора задачи. Метка модели берётся из реально выбранной
модели (`name`, иначе `id`), а не из захардкоженной строки.

`/b <task>` и `/bh <task>` по-прежнему показывают режим, thinking level и
сокращённое описание задачи без дополнительного phase protocol.

Жизненный цикл статуса:

- статус живёт **между turn'ами** всего запуска: `turn_end` его не очищает,
  иначе первый же вызов `workflow_status` (он всегда происходит в turn'е позже
  запуска команды) получал бы `No active workflow command` и footer был бы
  бесполезен;
- терминальные фазы `finishing` и `blocked` очищают footer сразу, поэтому
  завершённая или остановленная задача не выглядит активной;
- `agent_settled` очищает footer как страховка, если агент закончил запуск без
  терминальной фазы (retry, compaction, прерывание);
- фаза валидируется по списку фаз до проверки активности workflow, поэтому
  опечатка в фазе диагностируется всегда.

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

## Issue execution workflow

`/n` предназначен для проектов, где backlog уже организован в GitHub Issues и
есть понятная очередь выполнения. Он не создаёт второй планировщик поверх
существующей системы.

`/i <issue>` использует тот же implementation/verification/review pipeline, но
не ищет следующую задачу: выполняется ровно указанная issue. Если она закрыта,
gated, blocked зависимостью или иным образом сейчас не исполнима, workflow
останавливается вместо обхода проектных ограничений.

Алгоритм:

1. определяет текущий GitHub repository и читает только релевантные инструкции;
2. ищет каноническую execution queue / `START HERE` issue, затем `current`,
   `next` или первый незавершённый незаблокированный пункт явной очереди;
3. уважает `gated`, blocked/research/date/dependency условия и останавливается,
   если next нельзя определить однозначно;
4. считает существующий issue body/checklist текущим планом и не запускает
   дорогой planning заново без необходимости;
5. для отсутствующей и реально рискованной архитектуры может эскалировать в
   `planner → plan-reviewer`;
6. реализует только одну issue за invocation, запускает нужные проверки и для
   нетривиального diff делает один независимый pass через `reviewer`;
7. исправляет валидные blocking/important findings, повторяет затронутые
   проверки и только после этого завершает GitHub workflow;
8. если в проекте уже есть `current/next` queue, обновляет её существующим
   способом, не создавая новые labels и не переприоритизируя остальной backlog.

При `/i` шаг выбора задачи пропускается. Existing queue обновляется только если
указанная issue действительно представлена в ней и текущие правила проекта
требуют такого обновления; unrelated backlog не переставляется.

Такой режим особенно полезен для репозиториев вроде SakuSaku/Roman AC 01, где
GitHub Issues уже содержат порядок работы и acceptance criteria: повторный
Luna → Terra planning на каждую заранее разобранную issue только зря тратил бы
контекст и дорогой review.

## Model routing

Текущая схема специально разделяет дешёвые механические роли, planning,
независимый review и реализацию:

- основной default Pi — `opencode-go/deepseek-v4-flash` (тестовый default),
  startup thinking — `low`;
- `/n`, `/i`, `/b`, `/build`, `/bh` —
  `opencode-go/deepseek-v4.1-flash`;
- `scout` — `opencode-go/mimo-v2.5`, low thinking;
- `reviewer` — `opencode-go/mimo-v2.5`, medium thinking;
- `planner` — `opencode-go/gpt-5.6-luna`, high thinking;
- `plan-reviewer` — `openai-codex/gpt-5.6-terra`, high thinking.

`plan-reviewer` использует отдельный OpenAI Codex/ChatGPT provider ради
независимого plan review. Если он ещё не авторизован в Pi, выполните login для
`openai-codex`; остальные роли используют существующий OpenCode Go provider.

## Автоматический planning workflow

`/p <task>` делает весь pre-implementation цикл одной пользовательской
командой. Parent Pi запускает один foreground `pi-subagents`
`workflowScript`:

1. `planner` изучает релевантный код и формирует implementation plan;
2. `plan-reviewer` получает исходную задачу и полный план и независимо его
   проверяет;
3. при `PLAN_VERDICT: approve` план возвращается без лишнего прохода;
4. при `PLAN_VERDICT: revise` новый `planner` pass получает original plan +
   review и выпускает исправленный final plan;
5. при `PLAN_VERDICT: insufficient-context` workflow останавливается и
   возвращает недостающий контекст вместо догадок.

Все стадии read-only. Реализация начинается отдельно через `/b` или `/bh`,
поэтому дорогой review не смешивается с mutation work.

## Agent definitions

Пользовательские роли лежат в `agents/` и переопределяют одноимённые
bundled-роли `pi-subagents`:

- `scout` — дешёвая read-only разведка;
- `reviewer` — дешёвый независимый first-pass code review;
- `planner` — подробный repo-aware implementation planning;
- `plan-reviewer` — дорогой независимый pre-implementation review.

## Что хранится в Git

- `settings.json` — тема, модель по умолчанию, безопасный startup
  `defaultThinkingLevel: low` и список пакетов;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
- `extensions/workflow.ts` — локальные workflow-команды, требующие поведения
  сложнее обычного prompt template;
- `.local/bin/pi` — единственный launcher Pi с permission system,
  `pi-subagents`, Antigravity bridge, recap и workflow;
- `extensions/subagent/config.json` — компактное описание subagent tool и depth=1;
- `extensions/workflow.ts` — `/n`, `/i`, build-команды, model/thinking
  routing, `workflow_status` tool и live workflow phase в footer;
- `agents/*.md` — пользовательские определения ролей `pi-subagents`;
- `prompts/*.md` — короткие slash workflow templates;
- `npm/package.json` и `npm/package-lock.json` — воспроизводимый список
  npm-зависимостей.

`auth.json`, `models-store.json`, `sessions/`, `pi-subagents/`,
`extensions/*/state`, `.agents/hooks.json` и `npm/node_modules/` остаются локальными и не должны
попадать в Git.

## Политика разрешений

Обычные чтение, поиск и редактирование внутри рабочего каталога разрешены
автоматически. `.env`, ключи, SSH-файлы и Pi credentials запрещены явно.
Остальные действия в доверенном режиме проходят без подтверждения.

Pi работает в доверенном режиме (`yoloMode: true`): результаты `ask`
автоматически разрешаются. Политика остаётся важной для явных `deny`:
`.env`, ключи, SSH-файлы, npm/netrc credentials и Pi auth остаются
заблокированными. Это режим полного доверия к агенту в локальной среде — он
может выполнять в том числе `rm`, `git push` и сетевые операции.
