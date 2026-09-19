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

## Что хранится в Git

- `settings.json` — тема, модель по умолчанию и список пакетов;
- `extension-data/pi-recap/config.json` — настройки recap;
- `extensions/pi-permission-system/config.json` — глобальная политика доступа Pi;
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
разрешён автоматически: read-only git-команды, `git add/commit/fetch`,
типичные test/lint/typecheck/build команды для Python и JS, а также обычная
установка зависимостей через npm/pnpm/yarn/bun/uv/pip/poetry. Опасные операции
(`sudo`, `rm`, destructive git, process kills), `git push` и незнакомые
shell-команды по-прежнему требуют подтверждения.
