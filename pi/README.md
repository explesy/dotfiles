# Pi config

Source of truth для конфигурации Pi — этот GitHub-репозиторий
`explesy/dotfiles`, каталог `pi/`. Старый Google Drive `OpenCode Config`
больше не используется и не должен считаться актуальным источником настроек.

Глобальная конфигурация Pi хранится в `.config/pi/` и подключается через
`stow --ignore=node_modules pi`: локальный runtime-каталог `npm/node_modules`
не должен участвовать в Stow. В shell экспортируется `PI_CODING_AGENT_DIR=$HOME/.config/pi`,
поэтому Pi использует XDG-путь вместо `~/.pi/agent`.

## Установка

Текущий compatibility target этой конфигурации — **Pi 1.0.4**. Pi установлен
глобально через npm, поэтому на уже настроенной машине сначала обновите сам Pi,
затем зависимости конфигурации:

```sh
npm install -g --ignore-scripts @earendil-works/pi-coding-agent@latest
cd "$HOME/.config/pi/npm" && npm install
```

Для обычного обновления используйте команду `pi-update`, которая появляется в
`~/.local/bin` после `stow pi`:

```sh
pi-update
```

Для проверки без обновления используйте:

```sh
pi-update --check
```

Команда обновляет сам Pi, затем запускает `pi update --extensions` (reconcile
пакетов из `packages` в `settings.json` и их зависимостей), после чего
проверяет совпадение глобального Pi с четырьмя SDK-пакетами и их pins в
manifest, а также состояние локального `npm`-дерева. `pi-update --check`
выполняет те же проверки без установки. При расхождении команда завершается
с ошибкой и показывает версии manifest / installed / CLI; SDK pins нужно
согласовать в репозитории. На текущей установке глобальный Pi находится в
Homebrew-prefix, но установлен через npm, поэтому для установки самого Pi
скрипт явно использует `/opt/homebrew/bin/npm`. Это важно: обычный `npm` может
быть npm из fnm и обновить другой global-prefix.

Если в будущем Pi будет зарегистрирован как Homebrew-формула
`pi-coding-agent`, `pi-update` автоматически использует `brew upgrade
pi-coding-agent`. Версии расширений обновляются по semver-диапазонам в
manifest; точные SDK pins согласуются в репозитории вручную после проверки
совместимости.

Для новой установки из корня репозитория:

```sh
mkdir -p "$HOME/.config/pi" "$HOME/.config/pi/npm"
stow --ignore=node_modules pi
cd "$HOME/.config/pi/npm" && npm install
```

### Managed bridge

Pi использует точную версию опубликованного
[`@estebanforge/pi-antigravity-bridge`](https://github.com/EstebanForge/pi-antigravity-bridge),
а не патчит `node_modules` после установки. Версия **1.7.9** сохраняет
полный approval-ответ `{ decision, reason }` и изолирует hooks в приватном
каталоге конкретной Pi-сессии, поэтому standalone Antigravity в том же
workspace больше не получает чужой approval gate. В ней также обновлён
каталог моделей: Claude 4.6 и GPT OSS удалены upstream, их актуальные
замены — Claude 5.5 с уровнями thinking.

Версия закреплена в `npm/package.json` и `npm/package-lock.json`, поэтому
`npm install` воспроизводимо берёт именно проверенный пакет. Локальные
изменения `node_modules` не являются источником истины.

Herdr больше не участвует в оркестрации Pi. Его можно использовать отдельно как
терминальный мультиплексор, а дочерние задания запускаются через
`pi-subagents` внутри одной Pi-сессии.

`~/.config/pi` должна оставаться реальной директорией: Pi и его расширения
пишут туда сессии, модели, auth и runtime-состояние. Настройки из этого
пакета линкуются в неё отдельными файлами.

После `stow pi` в `~/.local/bin` появляются только helper-команды
(`pi-update`, `pi-stealth`); сам `pi` запускается стоковым бинарником
Homebrew. Pi подхватывает расширения нативно: пакеты из `packages` в
`settings.json` плюс discovery каталога `~/.config/pi/extensions/` — это
permission system, `pi-subagents`, Antigravity bridge, recap, Context7 и
локальный workflow extension. Встроенные MCP, codemode и tool search
загружаются по умолчанию; `llama.cpp` отключён явно
(`-builtin:llama.cpp` в `settings.json`), потому что локальные GGUF-модели не
используются. Проектные `.pi/`-ресурсы (extensions, skills, prompts, themes)
загружаются только после доверия проекту, как и в стоковом Pi. Pi запускается
в доверенном режиме: permission system автоматически разрешает действия со
статусом `ask`, не показывая диалогов. Явные запреты (`deny`) сохраняются —
в частности, для `.env`, ключей и credentials.

Для делегирования используется плоский инструмент `subagent`, а глубина
вложенной делегации ограничена одним уровнем.

## Основная команда

Для повседневной работы используйте `/i`. Она принимает задачу любого типа,
конкретную GitHub issue или уже согласованную задачу из разговора:

```text
/i исправь ошибку сортировки в списке
/i подготовь документ по согласованным требованиям
/i 37
/i #37 сначала проверь backward compatibility
/i
```

Без аргументов `/i` продолжает согласованную задачу; если задачи нет, уточняет её,
а не выбирает backlog самостоятельно. `/i --next` явно поручает выбрать одну
следующую исполнимую задачу из существующей очереди проекта. `/n` сохраняется как
совместимый способ сделать то же самое.

Основной агент сам выбирает подход и проверки по задаче и инструкциям проекта.
Планирование, scouting и independent review не являются обязательной цепочкой.
Дополнительная read-only помощь используется при конкретной неопределённости,
существенном риске, явном запросе или требовании проекта. Пользователь не выбирает
между внутренними режимами orchestration. `/ox` и `/ix` остаются экспериментами,
а не вариантами, которые нужно сравнивать перед обычной задачей.

По умолчанию `/i` использует DeepSeek V4.1 Flash/high. Для совместимости сохранён
синтаксис `/i ds|codex|luna|agy <issue> [instruction]`: `codex` — GPT-6.1 Sol/medium,
`luna` — GPT-6 Luna/high, `agy` — Gemini 3.8 Flash/low. Это дополнительная настройка,
не обязательный выбор. В свободном тексте первое слово `codex`/`luna` и т. п.
сохраняется как часть задачи, если за ним не следует номер issue или `--next`.

Если нужен только план, явно скажите «сначала план, без реализации» в задаче.
Существующая `/p <task>` сохраняется для явного read-only planning workflow;
переход к реализации требует отдельного поручения. Остальные старые команды
(`/pl`, `/rv`, `/sc`, `/c`, `/build`, `/b`, `/bh`) сохранены для совместимости и
специального применения, но для обычного выполнения задачи достаточно `/i`.

После обновления выполните `/reload` или перезапустите Pi.

### Workflow status в footer

Execution-команды показывают короткий live status в footer, пока идёт
соответствующий запуск.

Для `/n` и `/i` extension регистрирует UI-only tool `workflow_status`.
Агент вызывает его только при крупных переходах workflow, поэтому footer
показывает не просто запущенную команду, а текущую issue и фазу:

```text
N · DeepSeek V4.1 Flash · high · selecting
N · DeepSeek V4.1 Flash · high · #42 · selected · Detect player languages
N · DeepSeek V4.1 Flash · high · #42 · implementing · Detect player languages
N · DeepSeek V4.1 Flash · high · #42 · testing · Detect player languages
N · DeepSeek V4.1 Flash · high · #42 · reviewing · Detect player languages
N · DeepSeek V4.1 Flash · high · #42 · fixing · Detect player languages
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

### Approval gate

Bridge `1.7.9` оставляет `approvals.gateMode` в `auto`: при наличии Pi
permission extension нативные mutating-действия `agy` проходят через Pi-side
approval, а hooks лежат в приватном каталоге конкретной сессии. Поэтому
standalone Antigravity в том же workspace не видит чужой gate; модели
Antigravity, MCP bridge и обычная Pi permission policy остаются включены.

## Antigravity через `agy`

В конфигурацию добавлен `@estebanforge/pi-antigravity-bridge`. Он подключает модели
через установленный и авторизованный официальный CLI `agy`, а не через отдельный
OAuth-токен внутри Pi. После перезапуска доступны модели провайдера
`antigravity`:

- `antigravity/gemini-3-8-flash`;
- `antigravity/gemini-3-7-flash`;
- `antigravity/gemini-3-6-flash`;
- `antigravity/gemini-3-1-pro`;
- `antigravity/claude-sonnet-5-5`;
- `antigravity/claude-opus-5-5`.

Выбор модели:

```text
/model antigravity/gemini-3-8-flash
```

Диагностика bridge выполняется командой `/agy doctor` (`/agy status` удалена).
После обновления каталога моделей через `agy update` используйте `/reload` или
перезапустите Pi. Bridge по умолчанию запускает собственный закрытый tool loop
`agy`; его изменения файлов не проходят через обычный inline diff Pi. Команды
`agy` выполняются без отдельного подтверждения, поэтому не выбирайте
`accept-edits` для непроверенных репозиториев.

## Выполнение задач

`/i` и очередь через `/i --next` используют одни короткие правила:

1. Прочитать исходные требования и инструкции проекта, проверить релевантное
   состояние, сохранить посторонние изменения. Существующий план проверяется по
   текущему коду; обычные решения агент принимает сам.
2. Выполнить задачу в основной сессии. При необходимости составить короткий
   подход и привлечь подходящую read-only помощь, без обязательных agent chains.
   Обычный review использует `reviewer`, существенный риск — `reviewer-sol`;
   требования пользователя/проекта имеют приоритет.
3. При review передать дословные исходные требования отдельно от пересказа и
   плана, включая последующие уточнения. Проверять всё затронутое поведение,
   в том числе существующие helpers/consumers. Важные findings подтверждать
   исходниками, контрактом или целевой проверкой; предпочтения не считать багами.
4. Выбирать проверки по области влияния. Для изолированных изменений — целевые
   проверки и применимые build/lint; шире при широком или неясном влиянии.
   Обязательные проверки проекта сохраняются. Нужный full suite идёт после
   исправлений; повтор требует нового основания. Использовать реальные exit codes.
5. Сверить результат с исходной задачей, исправить существенные расхождения или
   явно сообщить незавершённость/исключения. Итог объясняет результат, пользу,
   проверки и ограничения; объём соответствует задаче и правилам проекта.

Issue читается вместе с актуальными требованиями и релевантными comments.
Closed/gated/blocked/research-only задачи и unmet dependencies не обходятся.
Очередь используется только по явному `/i --next` или `/n`; она не создаётся и
не переприоритизируется командой. Команда не даёт дополнительного разрешения
на push, deploy, внешние записи, покупки или разрушительные действия. Уже
согласованные разрешения действуют; безопасная разрешённая работа доводится
до конца. Обновления Issue/queue/handoff выполняются только когда они уместны
и авторизованы.

## Model routing

Текущая схема специально разделяет дешёвые механические роли, planning,
независимый review и реализацию:

- основной default Pi — `opencode-go/deepseek-v4.1-flash`,
  startup thinking — `low`;
- `/n`, `/i` — selectable main worker: default `ds` →
  `opencode-go/deepseek-v4.1-flash` / high; `codex` →
  `openai-codex/gpt-6.1-sol` / medium; `luna` →
  `openai-codex/gpt-6-luna` / high; `agy` →
  `antigravity/gemini-3-8-flash` / low;
- `/b`, `/build` — `opencode-go/deepseek-v4.1-flash` / low для механической
  реализации; `/bh` — та же модель / high;
- `scout` — `opencode-go/mimo-v2.6-flash`, low thinking;
- `reviewer` — `opencode-go/claude-haiku-5-5`, medium thinking;
- `reviewer-sol` — `openai-codex/gpt-6.1-sol`, high thinking для проверки
  рискованной реализации;
- `plan-reviewer-haiku` — `opencode-go/claude-haiku-5-5`, medium thinking для
  явной проверки планов; не обязательный этап `/i`;
- `planner` — `opencode-go/gpt-6-luna`, high thinking;
- `plan-reviewer` — `openai-codex/gpt-6.1-sol`, high thinking для рискованных
  планов и неизменённого workflow `/p`.

В `/n` и `/i` уровень `high` для DeepSeek действует на весь запуск, включая
проверку требований и плана. Обычный старт Pi и `/b` сохраняют `low`. В текущем
каталоге Pi у DeepSeek доступны `low`, `high`, `max`; `medium` преобразуется в
`high`.

`/n codex`, `/n luna`, `plan-reviewer` и `reviewer-sol` используют отдельный OpenAI
Codex/ChatGPT provider. Если он ещё не авторизован в Pi, выполните login для
`openai-codex`; остальные роли используют существующий OpenCode Go provider.

## Автоматический planning workflow

`/p <task>` делает весь pre-implementation цикл одной пользовательской
командой. Parent Pi запускает один foreground `pi-subagents`
`workflow` с абсолютным путём к сохранённому `workflows/plan-review.js`:

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
- `reviewer-sol` — независимый review рискованной реализации;
- `planner` — подробный repo-aware implementation planning;
- `plan-reviewer-haiku` — доступная роль для явной независимой проверки плана;
  `/i` не запускает её обязательным этапом;
- `plan-reviewer` — независимая углублённая проверка сложного плана и reviewer
  для `/p`.

## Что хранится в Git

- `settings.json` — тема, модель по умолчанию, startup
  `defaultThinkingLevel: low`, список пакетов, добавленные `codemode` /
  `tool_search` и уведомления о значимых cache misses;
- `npm/package.json` / `package-lock.json` — фиксируют bridge `1.7.9`,
  `pi-subagents 0.76.1`,
  `@gotgenes/pi-permission-system 40.0.1`, `@zhcsyncer/pi-recap 0.4.3` и
  Context7 `0.1.2`, а также Pi SDK peer-пакеты `1.0.4` для
  воспроизводимой совместимости расширений;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
- `extensions/workflow.ts` — локальные workflow-команды, требующие поведения
  сложнее обычного prompt template;
- `.local/bin/pi-update` — единая команда обновления Pi и его расширений с
  проверкой итоговых версий;
- `extensions/subagent/config.json` — компактное описание subagent tool,
  depth=1 и `asyncByDefault: false` для foreground-режима на Pi 1.0;
- `extensions/workflow.ts` — `/n` с коротким worker selector
  (`ds|codex|luna|agy`), `/i`, build-команды, model/thinking routing,
  `workflow_status` tool и live workflow phase в footer;
- `agents/*.md` — пользовательские определения ролей `pi-subagents`;
- `prompts/*.md` — короткие slash workflow templates;
- `workflows/plan-review.js` — фиксированный read-only planning/review pipeline.

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

## Проверка обновления 2026-10-06 (Pi 1.0.4)

Pi и четыре SDK-пакета синхронизированы на `1.0.4`; bridge `1.7.9`,
permission system `40.0.1` и subagents `0.76.1` обновлены по release notes.
Recap `0.4.3` и Context7 `0.1.2` остаются на проверенных версиях. Новое
сопоставление абсолютных и относительных Bash путей появилось в permission
system 40.0.0; действующая политика по-прежнему задаёт Bash `ask` и явные
запреты чувствительных файлов. Устаревшие Claude 4.6 и GPT OSS модели убраны
из списка bridge. Рабочие зависимости установлены в
`~/.config/pi/npm`, а manifest и lockfile сохраняются в Stow-источнике.

Что из Pi 1.0 принято:

- SDK и lockfile синхронизированы с CLI `1.0.4`; `pi-update` и
  `pi-update --check` проверяют, что manifest, `node_modules` и CLI дают одну
  и ту же версию всех четырёх SDK-пакетов.
- `permission-system 40.0.1` включает текущую политику Pi 1.0 и исправления
  сопоставления команд; существующая конфигурация остаётся с Bash `ask` и
  явными запретами на чувствительные файлы.
- Codemode 1.0 использует меньше prompt-токенов. `builtin:codemode` и
  `builtin:tool-search` загружаются как встроенные расширения по умолчанию, а
  `defaultTools` включает сами инструменты.
- Image generation в codemode (`models.generateImages()`) доступна, отдельная
  настройка не нужна.

TUI/fullscreen: Pi 1.0 по умолчанию запускает fullscreen TUI. Оба режима
проверены в PTY с этой конфигурацией — footer, model label, версия `v1.0.0` и
список extensions отображаются одинаково, `workflow_status` использует тот же
`ctx.ui.setStatus`. Оставлен новый default (fullscreen), override в
`settings.json` не добавлен: конфиг проще, а fullscreen даёт встроенный
transcript для длинных сессий. Regular доступен через `--tui-mode regular` или
`"tuiMode": "regular"`.

Virtual models: API `pi.registerVirtualModel()` в 1.0 есть, но routing на него
не переведён. Селекторы `/n ds|codex|luna|agy`, отдельные agents с явными
`model`/`thinking` и видимый в footer route уже решают задачу; virtual model
добавил бы indirection, не убрав routing и не улучшив audibility. Решение:
пока не внедрять.

Pi Durable: `@earendil-works/pi-durable@1.0.0` — отдельный experimental
harness/SDK, а не расширение CLI; ему нужны собственные storage
(SQLite/JSONL), registry и execution environment. Текущие pain points —
возобновление работы и очередь задач — закрываются GitHub Issues и сессиями
Pi. Отдельный harness ради экспериментальной durability не добавляется.
Решение: wait; stable workflow не заменяется.

Radius: `/login` в 1.0 умеет Sign in with Radius, но Radius здесь не
подключён и не становится default paid provider; маршруты остаются явными.
Изменений не требуется.

Subagents на Pi 1.0: начиная с `pi-subagents 0.75.0`, detached background
children снова поддерживаются после удаления Pi 1.0 старого SDK export.
Установленная `0.76.1` содержит последующие исправления надёжности. В
`extensions/subagent/config.json` сохранён `"asyncByDefault": false`, чтобы
обычные workflow оставались последовательными и видимыми; `/p`, `/n` и `/i`
могут явно выбирать foreground-режим. Background и scheduled сценарии теперь
совместимы по release notes, но требуют отдельного запуска с авторизацией и
не проверялись в этой smoke-проверке.

Исторические smoke-тесты на Pi 1.0.0:

- `pi` и `pi --version` → `1.0.0`;
- `pi-update --check` → CLI и четыре SDK согласованы;
- managed `npm ls --depth=0` → 1.0.0, permission 37.0.0;
- print-mode ответ DeepSeek V4.1 Flash;
- startup-баннер подтверждает загрузку всех extensions: `workflow.ts`,
  `pi-subagents`, Antigravity bridge, permission system, recap, Context7;
- доступные tools включают `codemode`, `tool_search`, `subagent`,
  `workflow_status`, `resolve-library-id`, `query-docs` и Antigravity tools;
- codemode вернул `42`; `tool_search` отработал;
- permission deny на `.env` через bash без утечки содержимого;
- `/b` и `/bh` переключают модель и thinking level; `/i` без аргумента даёт
  usage-warning; исторический smoke-run вызывал `/agy status`, теперь для
  диагностики используется `/agy doctor`;
- foreground subagent (`scout`) вернул marker; `/p`-workflow planner →
  plan-reviewer в safe temp repo завершился verdict `approve`; background/async
  subagents недоступны (см. Subagents выше);
- fullscreen и regular TUI стартуют, footer и extensions на месте;
- prompt templates `/c`, `/pl`, `/rv`, `/sc`, `/p` загружены.

Шаблон `/p` использует новый file-backed формат subagents: `workflow` содержит
абсолютный путь к `workflows/plan-review.js`, а `args.task` — текущую задачу.
Фиксированный скрипт сохраняет pipeline planner → review → одна revision и
останавливается при ошибке дочернего запуска или неоднозначном verdict.
Inline `workflow: true` тоже поддерживается upstream, но в smoke-тесте DeepSeek
повторно вызывал инструмент без блока кода в том же сообщении и исправлялся
лишь после ошибок. Сохранённый скрипт устраняет эту зависимость от формата
ответа модели. Старые `workflowScript` и `workflowScriptPath` удалены upstream; `clarify`
для public workflow тоже нужно опускать, даже значение `false` отклоняется.

Planner переведён с `opencode-go/gpt-5.6-luna` на `opencode-go/gpt-6-luna`
с прежним `high` thinking. Обе модели отвечают через существующий OpenCode Go;
в текущем каталоге Pi у новой Luna ниже номинальная стоимость входа/выхода
(`0.1/0.5` против `0.2/1.2` за миллион токенов) при тех же лимитах контекста
и ответа. Это metadata каталога, а не измерение расходов подписки или
сравнительный benchmark качества planning.

Default/build остаются DeepSeek V4.1 Flash, scout и reviewer — Claude Haiku 5.5
(`low` и `medium` соответственно), plan-reviewer — GPT-6.1 Sol. В Pi 1.0 OpenAI Codex обозначен legacy,
но существующая OAuth-авторизация и запросы работают. Новый `/login openai`
потребует отдельного входа; автоматического переноса credentials нет.

Для Antigravity при фильтрации tools необходимо оставлять служебный tool
`antigravity`. После обновления уже открытый Pi нужно перезапустить или
выполнить `/reload`. Это smoke-проверка доступности, а не полный прогон
рабочих задач и дочерних planning/review workflows.

Известное ограничение: `npm audit` сообщает одну high-уязвимость
`brace-expansion@5.0.9`, закреплённой опубликованным shrinkwrap Pi `1.0.0`
(три advisory: quadratic-time expansion и два stack-exhaustion DoS).
`npm audit fix`, целевой `npm update` и root override не обновляют эту
вложенную копию; неэффективный override не сохранён. Исправленная версия
`5.0.12` опубликована, но требуется обновление зависимости в upstream
artifact Pi; локальный patch `node_modules` не применяется.

## Встроенные инструменты и документация

Работают нативные discovery и builtins. В `settings.json` стоят
`defaultTools: ["+codemode", "+tool_search"]`, `codemode.mode: "on"` и
`extensions: ["-builtin:llama.cpp"]`: обычные read/bash/edit/write доступны
рядом с JavaScript-оркестрацией инструментов, а неиспользуемый локальный
провайдер llama.cpp выключен точечно. `--tools` и `--no-tools` по-прежнему
переопределяют startup selection. Набор tools/agents subagents не сокращён,
но default execution переведён в foreground из-за несовместимости Pi 1.0 с
background children (см. выше).

Codemode полезен для параллельных независимых чтений и обработки результатов
до передачи их модели. Вложенные вызовы проходят permission system: проверка
чтения синтетического `.env` через `tools.read` вернула deny без содержимого.

MCP готов к подключению серверов через глобальный `mcp.json` в agent directory
или доверенный project `.pi/mcp.json`. Проверка использовала временный локальный
stdio-сервер: `tool_search` нашёл deferred echo tool и вызов вернул marker.
Постоянные внешние серверы этим изменением не добавляются.

Официальный `@upstash/context7-pi@0.1.2` предоставляет `resolve-library-id`,
`query-docs`, skill `context7-docs` и команду:

```text
/c7-docs next.js Cache Components
```

Проверен реальный resolve + query для Next.js. Отдельный MCP-сервер и API-ключ
для первоначальной работы не нужны; без ключа действуют лимиты по IP.
Для более высокой квоты можно передать `CONTEXT7_API_KEY` через окружение,
не записывая его в Git. В Context7 отправляется текст query: не передавайте
credentials, личные данные или закрытый исходный код.

Веб-поиск для любой основной модели включён значением `"webTools": true`
в конфиге bridge (`~/.pi/agent/antigravity-bridge/config.json`).
`agy_web_search` и `agy_read_url` выполняются через авторизованный `agy` и
расходуют Antigravity quota. Env `AGY_WEB_TOOLS` имеет приоритет над файлом,
поэтому для отключения в конкретном запуске:

```sh
AGY_WEB_TOOLS=0 pi
```

`/agy web off` переключает файловое значение и выключает web-инструменты на
следующем старте/reload — в отличие от прежнего launcher-дефолта, который
перекрывал runtime-переключение. Конфиг bridge не управляется Stow/Git: при
чистой установке его нужно создать один раз (или выполнить `/agy web on`).

`showCacheMissNotices: true` показывает значимые cache misses. Политика
`cacheWarming` не менялась: действует стандартный `streaming`, без включения
прогрева между задачами (`idle`).


## Local stealth browser

Для browser-задач, где обычный Chromium часто упирается в anti-bot
verification, Pi может использовать второй локальный backend: Invisible
Playwright с patched Firefox. На Apple Silicon он запускается в Linux ARM64
Docker-контейнере; нативный macOS build для основного upstream не требуется.

Конфигурация состоит из:

- `~/.config/pi/mcp.json` — MCP server `stealth` с exposure `codemode`;
- `~/.config/pi/stealth/compose.yml` — локальный ARM64 container;
- `~/.local/bin/pi-stealth` — lifecycle helper;
- `/stealth [task]` — browser workflow command.

Первый запуск после `git pull && stow --restow --ignore=node_modules pi`:

```sh
pi-stealth up
pi mcp list
```

Первый build скачивает Docker image, Python packages и patched Firefox engine.
Runtime-состояние, профиль и fingerprint сохраняются вне dotfiles:

```text
~/.local/share/pi-stealth/
  cache/
  mcp/
  profile/
```

Управление:

```sh
pi-stealth status
pi-stealth logs
pi-stealth restart
pi-stealth down
pi-stealth rebuild
```

После изменения MCP config в уже открытой Pi-сессии используйте `/reload`.
Проверочный запрос:

```text
/stealth открой https://example.com и скажи title и URL
```

Браузер работает внутри контейнера. Поэтому локальный dev server на Mac
`http://localhost:3000` для stealth backend доступен как
`http://host.docker.internal:3000`; prompt `/stealth` содержит это правило.

Обычный `/web` остаётся основным backend для локальной разработки,
существующих пользовательских browser sessions и human takeover.
`/stealth` используется явно для bounded browser-задач, где требуется
отдельная persistent identity или обычный Chromium получает verification.
