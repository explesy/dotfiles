# 🪐 Google Antigravity & agy CLI Configuration

Модуль управления глобальными конфигурациями для **Google Antigravity** и терминального интерфейса **Antigravity CLI (`agy`)** в составе dotfiles.

---

## 📂 Структура файлов

```text
antigravity/
├── .gemini/
│   ├── antigravity-cli/
│   │   └── settings.json    # Настройки CLI (права, режим, модель, редактор, TUI)
│   └── config/
│       ├── AGENTS.md        # Глобальные инструкции для агента (Colemak, стиль, проверки)
│       ├── config.json      # Глобальный конфиг Antigravity (плагины, авто-выполнение)
│       └── mcp_config.json  # Конфигурация MCP серверов (Model Context Protocol)
├── install.sh               # Безопасная линковка в ~/.gemini без затирания БД/токенов
└── README.md                # Это руководство
```

---

## 🚀 Установка и подключение

Для подключения конфигурации выполните скрипт установки из корня репозитория dotfiles:

```sh
./antigravity/install.sh
```

Или через GNU Stow:

```sh
stow antigravity
```

Скрипт `install.sh` автоматически:
- Создает каталоги `~/.gemini/antigravity-cli` и `~/.gemini/config`.
- Делает резервные копии (`.bak.<timestamp>`) существующих файлов, если они не являются симлинками.
- Безопасно связывает конфиги, не затрагивая сессионные базы данных SQLite (`*.db`), учетные записи (`oauth_creds.json`) и историю (`history.jsonl`).

---

## ⚡ Режим автоподтверждения (Auto-approval / Non-interactive)

По умолчанию `agy` запрашивает интерактивное подтверждение на запуск каждой терминальной команды и применение изменений файлов (`request-review`).

В данном репозитории настроен **полный режим автоподтверждения**:

1. **`toolPermission: "always-proceed"`** — агент выполняет терминальные команды и вызовы инструментов автоматически без всплывающего запроса подтверждения.
2. **`agentMode: "accept-edits"`** — модификации файлов применяются на диск сразу без остановки на интерактивный построчный diff-review (`request-review`).
3. **`artifactReviewPolicy: "always-proceed"`** — генерация артефактов не блокирует поток работы в ожидании ручного ревью.
4. **`allowNonWorkspaceAccess: true`** — разрешает агенту читать и записывать файлы за пределами текущего репозитория/воркспейса без прерываний.
5. **Вайлдкард-разрешения в `permissions.allow`**:
   ```json
   "permissions": {
     "allow": [
       "command(*)",
       "read_file(*)",
       "write_file(*)",
       "read_url(*)"
     ]
   }
   ```
   Внутренний механизм проверок прав использует префиксное сопоставление токенов. Правило `command(*)` безусловно разрешает любые шелл-команды.
6. **Antigravity Desktop (`config.json`)**:
   - `autoExecutionPolicy`: `"CASCADE_COMMANDS_AUTO_EXECUTION_EAGER"`
   - `permissionPreset`: `"AGENT_PERMISSION_PRESET_TURBO"`
   - `nonWorkspaceFileAccessPolicy`: `"AGENT_SETTING_POLICY_ALLOW"`
   - `enableTerminalSandbox`: `false`

---

## 📋 Чеклист: Что стоит настроить в Antigravity & agy

### 1. Модели и глубина рассуждений (Reasoning Effort)
- **Модель по умолчанию (`model`)**:
  - `Gemini 3.8 Flash (Medium)` — быстрая, отзывчивая модель для повседневной разработки и рефакторинга (по умолчанию).
  - `Gemini Pro` / `Gemini 3.8 Pro` — для сложных архитектурных задач, глубокого аудита и многоуровневого анализа.
  - Посмотреть доступные модели: `agy models`.
- **Reasoning Effort (`--effort`)**:
  - `low` — быстрые правки, простые скрипты, минимум затрат токенов.
  - `medium` — баланс скорости и глубины анализа (рекомендуется для большинства задач).
  - `high` — для нетривиального дебага, сложных рефакторингов и расследования регрессий.
- **Прямой Gemini API ключ (BYOK / Headless CI)**:
  - Можно работать без веб-авторизации Google Account: добавьте `"modelProvider": "gemini"` в `settings.json` и экспортируйте переменную `GEMINI_API_KEY`.

### 2. Режим песочницы (Terminal Sandbox)
- Текущее значение: `enableTerminalSandbox: false`.
- Если вы хотите запускать агента над непроверенным кодом из интернета, можно включить изолированную песочницу (`--sandbox` или `"toolPermission": "proceed-in-sandbox"`). В этом режиме безопасные команды выполняются в песочнице, а потенциально опасные требуют подтверждения.

### 3. MCP Серверы (Model Context Protocol) в `mcp_config.json`
По аналогии с вашей конфигурацией в `codex/config.toml`, в `~/.gemini/config/mcp_config.json` можно подключить:
- **GitHub MCP Server**: для работы с PR, issues и репозиториями через CLI (`gh auth`).
- **Chrome DevTools**: встроенный плагин `chrome-devtools-plugin` уже включен для браузерного тестирования и инспекции DOM.
- **Docker MCP Gateway**: запуск изолированных инструментов через Docker (`docker mcp gateway run`).
- **Собственные локальные утилиты**: базы данных SQLite, интеграции с заметками.
- Управление серверами из CLI: `agy mcp list`, `agy mcp add`, `agy mcp enable <name>`.

### 4. Терминальный интерфейс и редактор (TUI & Editor)
- **`editor`: `"nvim"`** — вызов системного редактора (Neovim из вашего dotfiles стека) при ручном редактировании промптов и артефактов.
- **`editorMode`: `"vim"` vs `"default"`** — поддержка модального редактирования Vim прямо в строке ввода промпта `agy` (`Normal`, `Insert`, `Visual`). Если включить `"editorMode": "vim"` и `"vimInsertFirst": true`, ввод сразу готов к тексту, а `Esc` переключает в Normal mode.
- **`colorScheme`: `"terminal"`** — корректно наследует палитру Ghostty / WezTerm / Alacritty (Gruvbox).
- **`notifications`: `true`** — отправка системных нотификаций macOS (через Notification Center) по завершении долгой генерации или фоновой задачи.
- **`copyOnSelect`: `true`** — выделенный в интерфейсе текст автоматически копируется в системный буфер обмена macOS (`pbcopy`).
- **`pickerGrouping`: `"grouped"` vs `"none"`** — группировка списка сессий по репозиториям при вызове `/resume`.

### 5. Глобальные правила агента (`AGENTS.md`)
- В `~/.gemini/config/AGENTS.md` зафиксированы правила под ваш рабочий процесс:
  - Приоритет Colemak навигации `h / n / e / i`.
  - Лаконичные ответы на русском языке с явным указанием рисков и проверок.
  - Обязательные кликабельные ссылки на файлы и символы.
  - Дисциплина при работе в режиме автоподтверждения.

### 6. Интеграция с оболочкой (Fish) и мультиплексорами (Herdr / Tmux)
- В `fish/.config/fish/config.fish` путь к CLI уже экспортирован (`fish_add_path $HOME/.local/bin`).
- Можно добавить удобные аббревиатуры (abbr):
  ```fish
  abbr -a ag 'agy'
  abbr -a agc 'agy --continue'
  abbr -a agp 'agy --mode plan'
  ```
- Для одновременной параллельной работы нескольких агентов `agy` отлично комбинируется с настроенным в системе `herdr` или окнами `tmux`/`zellij`.
