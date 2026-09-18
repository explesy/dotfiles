# ⚡ Personal Dotfiles & System Configs

<p align="left">
  <img src="https://img.shields.io/badge/OS-macOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS" />
  <img src="https://img.shields.io/badge/Layout-Colemak-3b82f6?style=for-the-badge" alt="Colemak" />
  <img src="https://img.shields.io/badge/Manager-GNU_Stow-4b5563?style=for-the-badge" alt="GNU Stow" />
  <img src="https://img.shields.io/badge/WM-AeroSpace-7c3aed?style=for-the-badge" alt="AeroSpace" />
  <img src="https://img.shields.io/badge/Editor-LazyVim-57A143?style=for-the-badge&logo=neovim&logoColor=white" alt="LazyVim" />
  <img src="https://img.shields.io/badge/Shell-Fish-ea580c?style=for-the-badge" alt="Fish" />
</p>

Персональные конфигурации и скрипты для рабочей среды macOS. Стек выстроен вокруг эргономики **Colemak**, тайлового оконного менеджера **AeroSpace**, современного терминального инструментария и AI-агентов. Все компоненты модульные и подключаются через **GNU Stow**.

---

## 📑 Содержание

- [✨ Ключевые особенности](#-ключевые-особенности)
- [📂 Модули репозитория](#-модули-репозитория)
- [🚀 Быстрый старт](#-быстрый-старт)
  - [Установка GNU Stow](#1-установка-gnu-stow)
  - [Управление пакетами](#2-управление-пакетами)
- [⌨️ Раскладка и навигация Colemak](#️-раскладка-и-навигация-colemak)
- [🛠️ Шпаргалка по компонентам](#️-шпаргалка-по-компонентам)
  - [🪟 AeroSpace (Tiling Window Manager)](#-aerospace-tiling-window-manager)
  - [🐟 Fish Shell](#-fish-shell)
  - [📟 Herdr, Tmux & Zellij (Мультиплексоры)](#-herdr-tmux--zellij-мультиплексоры)
  - [📁 Yazi (Терминальный файловый менеджер)](#-yazi-терминальный-файловый-менеджер)
  - [🤖 AI Стек (Codex, OpenCode & Antigravity)](#-ai-стек-codex-opencode--antigravity)
  - [🎬 Медиаплееры (IINA & mpv)](#-медиаплееры-iina--mpv)
- [📦 Homebrew & Обслуживание](#-homebrew--обслуживание)

---

## ✨ Ключевые особенности

- **Unified Colemak Navigation:** сквозная навигация `h / n / e / i` (Left / Down / Up / Right) во всех инструментах вместо классического QWERTY `h / j / k / l`.
- **Модульность через GNU Stow:** каждый пакет изолирован и линкуется в систему отдельной командой без ручного копирования.
- **Современный CLI-стек:** Fish shell со Starship промптом, авто-`zoxide`, `eza`, `yazi`, `lazygit`, `lazydocker`.
- **Тайловый рабочий стол:** AeroSpace с автоматической раскладкой приложений по воркспейсам и accordion-режимом.
- **AI Tooling & MCP:** расширенная конфигурация Codex (MCP серверы, кастомные агенты, скиллы, питомцы) и OpenCode.

---

## 📂 Модули репозитория

| Категория | Модуль | Описание | Целевой путь в системе |
| :--- | :--- | :--- | :--- |
| **Оконный менеджер & Ввод** | [aerospace](./aerospace) | Тайловый оконный менеджер для macOS (Colemak-схема) | `~/.config/aerospace/` |
| | [kanata](./kanata) | Низкоуровневый перемаппинг клавиш (Caps↔Esc, Shift tap) | `~/.config/kanata/` |
| | [karabiner](./karabiner) | Альтернативный перемаппинг клавиш через Karabiner | `~/.config/karabiner/` |
| **Терминалы** | [ghostty](./ghostty) | Основной GPU-терминал с Fish-интеграцией и no-decorations | `~/.config/ghostty/` |
| | [wezterm](./wezterm) | Терминал на Lua с расширенной кастомизацией | `~/.config/wezterm/` |
| | [alacritty](./alacritty) | Легковесный кроссплатформенный терминал | `~/.config/alacritty/` |
| **Оболочки & Промпт** | [fish](./fish) | Основная оболочка с аббревиатурами и интеграциями | `~/.config/fish/` |
| | [starship](./starship) | Быстрый кросс-шелл промпт | `~/.config/starship.toml` |
| | [zsh](./zsh) | Резервная Zsh-конфигурация | `~/.zshrc` |
| **Мультиплексоры** | [herdr](./herdr) | Воркспейс-менеджер и мультиплексор для AI-агентов (детекция состояний, мышь) | `~/.config/herdr/` |
| | [tmux](./tmux) | Терминальный мультиплексор (Colemak, Yazi passthrough) | `~/.tmux.conf` |
| | [zellij](./zellij) | Мультиплексор на Rust с переопределенными хоткеями | `~/.config/zellij/` |
| **Редакторы & IDE** | [lazy_nvim](./lazy_nvim) | Neovim на базе LazyVim с Colemak-навигацией | `~/.config/nvim/` |
| | [code](./code) | Настройки VS Code (Gruvbox Hard, Vim, Python, formatters) | `~/.config/Code/User/` |
| **Файловые менеджеры** | [yazi](./yazi) | Быстрый файловый менеджер (Gruvbox, превью PDF/картинок) | `~/.config/yazi/` |
| | [ranger](./ranger) | Классический терминальный менеджер на Python | `~/.config/ranger/` |
| **AI & Агенты** | [codex](./codex) | Codex стек: MCP серверы, агенты, скиллы, runbooks | `~/.codex/` |
| | [opencode](./opencode) | Глобальные настройки OpenCode (модели, TUI, права) | `~/.config/opencode/` |
| | [antigravity](./antigravity) | Antigravity & agy CLI (автоподтверждение, MCP, глобальные правила) | `~/.gemini/` |
| **Медиа & Разное** | [iina](./iina) | Конфигурация ввода IINA для macOS | `~/Library/Application Support/...` |
| | [mpv](./mpv) | Минималистичный видеоплеер | `~/.config/mpv/` |
| | [docker](./docker) | Памятка по первоначальной настройке Docker | *Справочник* |
| | [userscripts](./userscripts) | Пользовательские скрипты (MeTube интеграция для YouTube) | *Браузерные расширения* |

---

## 🚀 Быстрый старт

Репозиторий использует [GNU Stow](https://www.gnu.org/software/stow/) для создания симлинков из папок репозитория в домашнюю директорию (`$HOME`).

### 1. Установка GNU Stow

```sh
brew install stow
```

### 2. Управление пакетами

Выполняйте команды из корневой папки репозитория:

```sh
# Подключить конкретный модуль (например, fish и aerospace)
stow fish
stow aerospace

# Проверить результат без создания симлинков (Dry Run)
stow -n -v ghostty

# Переподключить модуль (полезно при добавлении новых файлов)
stow -R yazi

# Отключить модуль (удалить все созданные им симлинки)
stow -D alacritty
```

> [!TIP]
> При первой настройке системы можно накатить основной стек одной командой:
> ```sh
> stow aerospace ghostty fish starship tmux lazy_nvim yazi kanata
> ```

---

## ⌨️ Раскладка и навигация Colemak

Конфигурация оптимизирована для эргономичной раскладки **Colemak**. Навигация по направлениям унифицирована во всех приложениях (AeroSpace, Neovim, Tmux, Zellij, Yazi):

| Направление | Colemak | Классический Vim (QWERTY) |
| :--- | :---: | :---: |
| ⬅️ Влево (Left) | **`h`** | `h` |
| ⬇️ Вниз (Down) | **`n`** | `j` |
| ⬆️ Вверх (Up) | **`e`** | `k` |
| ➡️ Вправо (Right) | **`i`** | `l` |

В [Neovim](./lazy_nvim), [Tmux](./tmux) и [AeroSpace](./aerospace) все связанные комбинации (`jk -> ne`, перемещение панелей и курсора) адаптированы под эту схему.

### Низкоуровневые ремапы ([Kanata](./kanata) / [Karabiner](./karabiner))
- `Caps Lock` ↔ `Escape`
- `Right Shift` (короткое нажатие) → `Caps Lock` (быстрое переключение языка)
- `Shift` + `Backspace` → Forward Delete (`Delete`)
- `Fn` → `Left Control` (для встроенной клавиатуры Mac)

---

## 🛠️ Шпаргалка по компонентам

### 🪟 AeroSpace (Tiling Window Manager)

Управление окнами в стиле i3/sway, оптимизированное под macOS:
- **Layout:** `accordion` по умолчанию, zero gaps.
- **Воркспейсы:**
  - `1` — Браузер (Firefox)
  - `2` — Терминал (WezTerm / Ghostty)
  - `3` — Мессенджеры (Telegram)
  - `4` — Редакторы и код (Zed, Codex, Claude)
  - `5` — Web / Misc (ChatGPT Atlas)
  - `M` — Музыка (Spotify)
  - `A` — Коммуникации и AI (Microsoft Teams, Antigravity)
- **Основные хоткеи:**
  - `Alt + h / n / e / i` — смена фокуса окна
  - `Alt + Shift + h / n / e / i` — перемещение окна
  - `Alt + 1..5, M, A` — переход на воркспейс (`Alt + Shift + ...` — отправить окно)
  - `Alt + Tab` — переключение на предыдущий воркспейс
  - `Alt + -` / `Alt + =` — уменьшить / увеличить размер окна
  - `Alt + Shift + \`` — вход в **Service Mode** (`r` — reload, `f` — toggle float, `esc` — exit)

---

### 🐟 Fish Shell

Основной shell с быстрыми сокращениями и утилитами:

#### Аббревиатуры (Abbreviations)
| Аббревиатура | Разворачивается в | Назначение |
| :--- | :--- | :--- |
| `ls` | `eza` | Современный список файлов |
| `ll` | `eza -la --sort=type` | Подробный список с группировкой по типу |
| `lg` | `lazygit` | TUI для работы с Git |
| `ld` | `lazydocker` | TUI для Docker контейнеров |
| `dcu` / `dcd` | `docker compose up` / `down` | Управление Compose-стеком |
| `v` | `nvim .` | Быстрый запуск Neovim в текущей папке |
| `clr` | `clear` | Очистка экрана |
| `bu` | `brew update` | Обновление списков Homebrew |
| `buu` | `brew update; and brew upgrade` | Полное обновление системы через Brew |
| `ag` | `agy` | Запуск Antigravity CLI |
| `agc` | `agy --continue` | Продолжить последнюю сессию Antigravity |
| `agp` | `agy --mode plan` | Запуск Antigravity в режиме планирования |
| `ddr` | `cd ~/notes/dd && uv run python refresh.py` | Обновление данных Project Dashboard |
| `ddw` | `cd ~/notes/dd && uv run python refresh.py --watch` | Автообновление Project Dashboard (watch mode) |

#### Функции (Functions)
- `yy` — запуск `yazi` с автоматическим переходом (`cd`) в выбранную директорию при выходе.
- `c` — удобное копирование вывода любой команды в системный буфер обмена (`pbcopy`).
- `dd` — запуск локального веб-сервера Project Dashboard на порту 8787.

---

### 📟 Herdr, Tmux & Zellij (Мультиплексоры)

#### [herdr](./herdr)
- **Концепция:** терминальный воркспейс-менеджер с отслеживанием состояний AI-агентов (`working` / `blocked` / `done` / `idle`), полным управлением мышью и богатым Socket API.
- **Префикс:** `Ctrl + a` (унифицирован с tmux)
- **Сплиты:** `prefix + v` (вертикальный) и `prefix + -` (горизонтальный)
- **Управление:** `prefix + z` (zoom), `prefix + b` (скрыть/показать sidebar), `prefix + q` (detach в фон)
- **Сервер:** `herdr status`, `herdr server reload-config`, `herdr server stop`
- **Подробное руководство:** см. [`herdr/README.md`](./herdr/README.md)

#### [tmux](./tmux)
- **Префикс:** `Ctrl + a`
- **Навигация по панелям:** `prefix + h / n / e / i`
- **Сплиты:** `prefix + |` (вертикальный) и `prefix + -` (горизонтальный)
- **Графика:** включен `allow-passthrough` для отображения картинок в Yazi
- **Сессии ([tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect)):**
  - `prefix + Ctrl + s` — сохранить сессию
  - `prefix + Ctrl + r` — восстановить сессию

#### [zellij](./zellij)
- Полностью переопределенные бинды под Colemak (`h/n/e/i` для фокуса).
- Выход из любого режима через `Ctrl + a` или `Ctrl + g`.

---

### 📁 Yazi (Терминальный файловый менеджер)

- **Навигация и действия:**
  - `i` — smart enter: войти в папку или открыть файл
  - `F` — jump-to-char: мгновенный прыжок по первой букве имени
  - `c a a` — архивация выделенных файлов
  - `c a p` / `c a h` / `c a l` / `c a u` — архивация с паролем, шифрованием заголовков и кастомным сжатием
- **Превью:** встроенное отображение изображений и PDF через `poppler` (`pdftoppm`).
- **Тема:** принудительно зафиксирована `gruvbox-dark`.
- **Плагины:** при чистой установке восстановите плагины командой:
  ```sh
  ya pkg install
  ```

---

### 🤖 AI Стек (Codex, OpenCode & Antigravity)

- **[codex/](./codex):** локальная экосистема инструментов для Codex CLI.
  - Управление MCP-серверами (см. [`codex/mcp.md`](./codex/mcp.md)).
  - Кастомные агенты (`scout`, `hard-review`, `plan-reviewer`).
  - Набор готовых скиллов (`commit`, `pr`, `simplify`, `ui`, `preflight` и др.).
  - Кастомные TUI-питомцы в `codex/pets/`.
  - Управление горячими клавишами через `keybindings.json` (отключён глобальный вызов оверлея питомца `Alt+Space`, удержание диктовки на `LeftControl`).
  - Интеграция со статусами Herdr через хук `~/.codex/herdr-agent-state.sh`.
- **[opencode/](./opencode):** глобальная конфигурация [OpenCode](https://opencode.ai):
  - Оптимизированный роутинг моделей под экономику OpenCode Go (DeepSeek V4 Flash, GPT-5.6 Luna High, GLM-5.3 Flash).
  - Сбалансированный режим автономности: рутинный Git (`commit`, `push`, `checkout`), установка зависимостей, чтение внешних папок и веб-поиск выполняются без подтверждений; деструктивные операции (`rm`, `sudo`, `reset --hard`) и секреты (`*.env`) защищены.
  - Быстрое переключение автоподтверждения в TUI по горячей клавише `Cmd + Shift + A` (`mod+shift+a`).
  - Интеграция с мультиплексором Herdr (`plugins/herdr-agent-state.js`, `herdr-tui-session.js`).
- **[antigravity/](./antigravity):** конфигурация Google Antigravity и терминального агента `agy`:
  - Включен режим **автоподтверждения по умолчанию** (`toolPermission: always-proceed`, `agentMode: accept-edits`).
  - Разрешён доступ к файлам вне текущего воркспейса (`allowNonWorkspaceAccess: true`).
  - Глобальные инструкции агента (`AGENTS.md`) с приоритетом навигации Colemak (`h/n/e/i`).
  - Подключение и линковка через `./antigravity/install.sh` или `stow antigravity`.

---

### 🎬 Медиаплееры (IINA & mpv)

- **[IINA](./iina):** конфигурация клавиш лежит в `input_conf/doc.conf`. Подключение:
  ```sh
  stow iina
  defaults write com.colliderli.iina currentInputConfigName -string doc
  ```
- **[mpv](./mpv):** минималистичная конфигурация в `~/.config/mpv/`.

---

## 📦 Homebrew & Обслуживание

Для обновления всех GUI-приложений и cask-бинарников используется расширение `brew-cask-upgrade`:

```sh
# Добавить tap (если еще не подключен)
brew tap buo/cask-upgrade

# Проверить и обновить все устаревшие Cask-приложения
brew cu

# Обновить конкретное приложение
brew cu [CASK]
```
