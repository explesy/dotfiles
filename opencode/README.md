# opencode

Глобальная конфигурация [OpenCode](https://opencode.ai).

После `stow opencode` из корня репозитория `~/.config/opencode/`
приходит из этого каталога как набор symlink'ов:

```
~/.config/opencode/
├── opencode.jsonc   -> dotfiles/opencode/.config/opencode/opencode.jsonc
├── tui.json         -> dotfiles/opencode/.config/opencode/tui.json
├── agents/          -> подкаталог с .md файлами глобальных агентов
└── commands/        -> подкаталог с .md файлами slash-команд
```

Runtime-состояние плагинов (`node_modules`, `package.json`, `bun.lock`,
`package-lock.json`) лежит рядом в `~/.config/opencode/`, но в dotfiles
не коммитится — см. `.stow-local-ignore` в корне.

## install

Из корня dotfiles:

```sh
stow opencode
```

Если до этого `~/.config/opencode` существовал как обычная директория
(например, после `opencode plugin install`):

```sh
mv ~/.config/opencode /tmp/opencode.bak
stow opencode
cp -R /tmp/opencode.bak/node_modules ~/.config/opencode/
cp /tmp/opencode.bak/{package.json,bun.lock,package-lock.json} ~/.config/opencode/
```

## Структура

### `opencode.jsonc`

Главный конфиг. Содержит только то, что глобально:

- **Модели** — `model`, `small_model`, провайдерные timeouts и
  variants (для `gpt-5.6-terra` определены `high` и `low`).
- **Quality of life** — `formatter`, `lsp`, `share`, `autoupdate`,
  `logLevel`, `compaction`, `tool_output`, `watcher.ignore`.
- **Permissions** — глобальные bash/read rules. Все `ask` для
  деструктивных операций (см. ниже).
- **`agent.build`** — primary агент, через него запускаются
  сабагенты. Остальные глобальные агенты лежат в `agents/*.md`.

### `agents/*.md`

Глобальные сабагенты в markdown-форме (frontmatter + body). Имя
файла = имя агента.

- `cheap-explore.md` — быстрый read-only scout на `deepseek-v4-flash`.
- `coder.md` — имплементатор на `kimi-k2.7-code`.
- `reviewer.md` — read-only ревьюер на `glm-5.2`, читает файлы и
  git, не редактирует. Может звать `cheap-explore` для контекста.
- `hard-review.md` — дорогая эскалация на `openai/gpt-5.6-terra`.
  Variant выбирается через `variant_cycle` keybind или `--variant`
  CLI-флаг (`high` / `low`). Может звать `cheap-explore`.

### `commands/*.md`

Slash-команды. Тело файла = `template`, который уходит агенту.

- `/review` — ревью текущего diff через `reviewer`.
- `/hard` — независимый взгляд через `hard-review`.
- `/commit` — conventional-коммит, с защитой от случайной
  публикации секретов и build-артефактов.
- `/simplify` — поиск мест, которые можно упростить.

### `subagent_depth: 2`

Primary (`build`) может вызывать сабагентов. Сабагенты тоже
могут вызывать других сабагентов — но только тех, кому явно
разрешён `task`. Глобальный `permission.task` по умолчанию
разрешает только `cheap-explore` всем агентам. Конкретные агенты
(`reviewer`, `hard-review`, проектные) повторяют это явно во
избежание потери при merge.

## Глобальные permissions

`bash: { "*": "allow" }`, но ряд операций переопределён в `ask`:

- `rm` (все формы: `rm`, `rm -r`, `rm -rf`, `rm -fr`)
- `sudo`, `dd`, `mkfs`
- `chmod`, `chown`, `chgrp`
- `git push`, `git reset --hard`, `git clean`, `git branch -D`,
  `git checkout --`, `git stash drop`, `git remote remove`
- `curl`, `wget`, `npm install`, `pnpm add`, `yarn add`,
  `pip install`, `brew install`
- `pkill`, `killall`, `kill -9`
- `cat`/`head`/`tail`/`less`/`more`/`grep`/`rg` на `*.env` и
  `*.env.*` (обход read-deny через bash)

`read: { "*.env": "deny", "*.env.*": "deny" }` — но это только для
прямого `read`. Через `bash` срабатывает отдельный guard выше.

`webfetch: "ask"` — каждый запрос наружу подтверждаем.
`external_directory: "ask"` — выход за пределы рабочей директории
тоже спрашиваем.

`task: { "*": "deny", "cheap-explore": "allow" }` — сабагентов по
умолчанию нельзя; `cheap-explore` — исключение для всех.

## Variant switching для `gpt-5.6-terra`

`openai/gpt-5.6-terra` имеет два named variants в провайдерской
конфигурации:

- `high` (дефолт) — `reasoningEffort: "high"`, `textVerbosity: "low"`.
  Глубокое рассуждение, для серьёзных эскалаций.
- `low` — `reasoningEffort: "low"`, `textVerbosity: "low"`.
  Дешёвые рутинные ревью.

Переключение на лету:

- В TUI — `variant_cycle` keybind (см. `tui.json`/`keybinds`).
- В CLI — флаг `--variant high` или `--variant low`.

## Per-project override

Каждый проект может положить `opencode.json` (или `opencode.jsonc`)
в корень — он мерджится поверх глобального. На per-project уровне
доступны:

- `instructions: [...]` — массив путей к инструкциям
  (обычно `AGENTS.md` и релевантные `docs/...`).
- `references: { alias: { path, description } }` — алиасы для
  `@-mention` в чате, чтобы агенты знали про смежные доки.
- `mcp: { name: { type, command, enabled } }` — локальные MCP-серверы
  под конкретный проект (в глобальном конфиге их нет).
- `snapshot: false` — выключить snapshot-индексирование (для
  репо с тысячами файлов).
- `permission` — дозаказ поверх глобального, не замена (object'ы
  внутри заменяются, а не мерджатся).

Полный пример в `/Users/doc/notes/roman-ac-01/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  "instructions": [
    "AGENTS.md",
    "docs/README.md",
    "docs/plan.md",
    "docs/backlog.md"
  ],

  "references": {
    "roman-list": { "path": "../roman_list", "description": "..." },
    "architecture": { "path": "docs/architecture", "description": "..." }
  },

  "snapshot": false,

  "mcp": {
    "playwright": { "type": "local", "command": ["docker", "run", "-i", "--rm", "mcp/playwright"], "enabled": true },
    "ssh-laptop": { "type": "local", "command": ["node", "/Users/doc/Dev/ssh-mcp/build/index.js", "..."], "enabled": true },
    "sqlite":     { "type": "local", "command": ["uvx", "mcp-server-sqlite", "--db-path", "data/cache.sqlite", "--read-only"], "enabled": true }
  },

  "permission": {
    "webfetch": "ask"
  }
}
```

### Per-project agents и skills

В `.opencode/agents/<name>.md` — сабагенты, специфичные для
проекта. В `.opencode/skills/<name>/SKILL.md` — навыки,
которые агенты подгружают on-demand.

Оба авто-обнаруживаются opencode'ом при старте из корня
проекта. Примеры в `roman-ac-01/.opencode/`:

- `agents/db-migration.md` — миграции SQLite, schema, idempotency.
- `agents/provider-pipeline.md` — provider lifecycle, snapshot sync.
- `agents/seo-experiment.md` — гипотезы, evidence, без выдумок.
- `skills/preflight-release/SKILL.md` — `npm run preflight:release`.
- `skills/sync-roman-list/SKILL.md` — sync:roman-list →
  sync:providers → audit:pipeline.
- `skills/markdown-evidence/SKILL.md` — формат файлов
  `docs/marketing/evidence/`.

### Замечание про `webfetch`

`permission.webfetch` в opencode 1.18 принимает только
`"ask" | "allow" | "deny"` — **per-URL allowlist через config
не поддержан**. На каждый запрос UI предлагает три варианта:
`once` / `always` (на сессию) / `reject`. Для проектной
"доверенной зоны" выбирай `always` на ожидаемых доменах и
отказывай на неожиданных.

## verify

```sh
opencode debug config        # смотрим резолвнутый конфиг
opencode debug agent <name>  # детали по агенту
opencode debug skill         # список подгруженных skills
opencode debug lsp           # статус language servers
opencode models              # доступные модели
```

В TUI:

- `Tab` — переключение между primary агентами (build / plan).
- `/review`, `/hard`, `/commit`, `/simplify` — кастомные команды.
- `@reviewer`, `@hard-review`, `@coder`, `@cheap-explore` — вызов
  глобальных сабагентов.
- `@db-migration`, `@provider-pipeline`, `@seo-experiment` — вызов
  проектных сабагентов (если `cd` в проект).
- `variant_cycle` — переключение variant у `gpt-5.6-terra`.

После правки любого конфига или `.md` файла нужно перезапустить
opencode — конфиг не hot-reload'ится.
