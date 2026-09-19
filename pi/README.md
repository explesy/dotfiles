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

Launcher загружает permission system, `pi-subagents`, recap и локальный
workflow extension. Глубина вложенной делегации ограничена одним уровнем.

## Короткие workflow-команды

Prompt templates лежат в `prompts/` и появляются в slash autocomplete:

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
/p добавь кеширование результатов player probe
/sc найди где формируется список subtitle tracks
/pl особенно проверь миграции и backward compatibility
/b реализуй утвержденный план
/bh разберись с этой сложной race condition и реализуй исправление
/rv проверь exceptional paths и регрессии
/c исправь найденные blocking issues и закончи задачу
```

После изменения prompt templates или `extensions/workflow.ts` используйте
`/reload` либо перезапустите Pi.

## Model routing

Текущая схема специально разделяет дешёвые механические роли, planning,
независимый review и реализацию:

- основной default Pi — `opencode-go/deepseek-v4-flash` (тестовый default);
- `/b`, `/build`, `/bh` — `opencode-go/deepseek-v4.1-flash`;
- `scout` — `opencode-go/mimo-v2.5`, low thinking;
- `reviewer` — `opencode-go/mimo-v2.5`, medium thinking;
- `planner` — `opencode-go/gpt-5.6-luna`, high thinking;
- `plan-reviewer` — `openai-codex/gpt-5.6-terra`, xhigh thinking.

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

- `settings.json` — тема, модель по умолчанию и список пакетов;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
- `extensions/subagent/config.json` — компактное описание subagent tool и depth=1;
- `extensions/workflow.ts` — build-команды и model/thinking routing;
- `.local/bin/pi` — единственный launcher Pi;
- `agents/*.md` — пользовательские определения ролей `pi-subagents`;
- `prompts/*.md` — короткие slash workflow templates;
- `npm/package.json` и `npm/package-lock.json` — воспроизводимый список
  npm-зависимостей.

`auth.json`, `models-store.json`, `sessions/`, `pi-subagents/`,
`extensions/*/state` и `npm/node_modules/` остаются локальными и не должны
попадать в Git.

## Политика разрешений

Обычные чтение, поиск и редактирование внутри рабочего каталога разрешены
автоматически. `.env`, ключи, SSH-файлы и Pi credentials запрещены явно.
Остальные действия в доверенном режиме проходят без подтверждения.

Pi работает в доверенном режиме (`yoloMode: true`): результаты `ask`
автоматически разрешяются. Политика остаётся важной для явных `deny`:
`.env`, ключи, SSH-файлы, npm/netrc credentials и Pi auth остаются
заблокированными. Это режим полного доверия к агенту в локальной среде — он
может выполнять в том числе `rm`, `git push` и сетевые операции.
