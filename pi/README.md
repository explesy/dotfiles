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
herdr integration install pi
herdr integration status
```

Команды `herdr integration install pi` и `herdr integration status` устанавливают
или обновляют Pi-интеграцию Herdr и проверяют, что она доступна. Повторите их
после заметного обновления Herdr или `pi-herdsman`, если интеграция ведёт себя
неожиданно.

`~/.config/pi` должна оставаться реальной директорией: Pi и его расширения
пишут туда сессии, модели, auth и runtime-состояние. Настройки из этого
пакета линкуются в неё отдельными файлами.

После `stow pi` в `~/.local/bin` появляется команда `pi`. Каталог уже находится
раньше Homebrew в `$PATH`, поэтому новые shell-сессии используют launcher
автоматически. Он запускает permission system, recap и workflow, но не
загружает Herdr-инструменты. Поэтому запросы к Console Go не содержат
несовместимые схемы `agent`, `chief` и `staff` и не получают 400 до начала
работы модели.

## Короткие workflow-команды

Prompt templates лежат в `prompts/` и появляются в slash autocomplete:

- `/pl [focus]` — запустить независимый review текущего implementation plan через `plan-reviewer`;
- `/rv [focus]` — запустить независимый review текущей реализации через `reviewer`;
- `/sc [question]` — запустить узкое read-only исследование через `scout`;
- `/c [instruction]` — продолжить текущую задачу без повторного старта/перепланирования.

`/build [task]` — extension-команда, которая переключает текущую Pi-сессию на
`opencode-go/deepseek-v4.1-flash` и, если передан текст, сразу запускает его как
новый user turn. Короткий alias: `/b [task]`. Команда доступна только в базовом
`pi`; если Herdr-инструменты всё же загружены, она завершится с подсказкой
перезапустить Pi через настроенный launcher.

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

## Agent definitions

Глобальные роли лежат в `agents/` и переопределяют одноимённые bundled-роли
Herdsman:

- `scout` — `opencode/nemotron-3.5-lightning-free`, low thinking, read-only;
- `reviewer` — `opencode/mimo-v2.5-free`, medium thinking, read-only review +
  только read-only git через bash;
- `plan-reviewer` — `openai/gpt-5.6-terra`, high thinking, независимый
  pre-implementation plan review.

`plan-reviewer` использует тот же Terra mapping, что и текущий OpenCode
workflow; в Pi для провайдера `openai` должна быть настроена аутентификация.

## Что хранится в Git

- `settings.json` — тема, модель по умолчанию и список пакетов;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
- `extensions/workflow.ts` — локальные workflow-команды, требующие поведения
  сложнее обычного prompt template;
- `.local/bin/pi` — launcher базового режима;
- `agents/*.md` — глобальные Herdsman agent definitions;
- `prompts/*.md` — короткие slash workflow templates;
- `npm/package.json` и `npm/package-lock.json` — воспроизводимый список npm-зависимостей.

`auth.json`, `models-store.json`, `sessions/`, `pi-herdsman/`,
`extensions/*/state` и `npm/node_modules/` остаются локальными и не должны
попадать в Git.

## Политика разрешений

Доступ за пределами текущего рабочего каталога по умолчанию требует
подтверждения. Обычные чтение, поиск и редактирование внутри рабочего каталога
разрешены автоматически. `.env` и Pi credentials запрещены, ключи и SSH-файлы
требуют подтверждения.

Shell остаётся в режиме `ask` по умолчанию, но повседневный цикл разработки
разрешён автоматически: read-only git-команды, переходы `cd`, просмотр файлов
через `rg`/`grep`/`cat`/`head`/`sed -n`, `gh issue view`, `git add/commit/fetch`,
типичные test/lint/typecheck/build команды для Python и JS, а также обычная
установка зависимостей через npm/pnpm/yarn/bun/uv/pip/poetry. Разрешён и
`node -e` для локальных диагностических запросов (например, read-only SQLite),
поэтому эту возможность следует считать доверенной: технически JavaScript может
выполнить не только чтение. Опасные операции (`sudo`, `rm`, destructive git,
process kills), `git push` и незнакомые shell-команды по-прежнему требуют
подтверждения. В цепочке каждая команда проверяется отдельно: разрешённый `cd`
не отменяет запрос на подтверждение для следующего опасного шага.
