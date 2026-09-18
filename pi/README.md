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

По умолчанию доступ за пределами текущего рабочего каталога и shell-команды
требуют подтверждения. Обычные операции чтения, поиска и редактирования в
рабочем каталоге разрешены автоматически. `.env` и Pi credentials запрещены,
ключи и SSH-файлы требуют подтверждения. Для shell автоматически разрешён
только небольшой набор read-only команд (`ls`, `pwd`, `rg`, `find`, `cat`,
`git status`, `git diff`, `git log`, `git show`, `file`, `stat`, `du`, `df`,
`wc` и фильтры вывода); остальные команды, включая запись, установку
зависимостей и запуск скриптов, показываются пользователю на подтверждение.
