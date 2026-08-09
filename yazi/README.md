# yazi

Конфиг лежит в [`.config/yazi/`](./.config/yazi) и подключается через `stow yazi`.

Активный путь в системе:

```sh
~/.config/yazi/
```

## Файлы

- `yazi.toml` — базовые настройки менеджера
- `keymap.toml` — горячие клавиши (Colemak + archive-бинды `c a a|p|h|l|u`)
- `theme.toml` — жёстко закреплена тёмная тема `gruvbox-dark` в обоих режимах
- `flavors/gruvbox-dark.yazi/` — вендорная тема
- `plugins/*.yazi/` — вендорные плагины (smart-enter, jump-to-char, compress)

## Ключевые бинды

- `i` -> smart enter (войти в папку / открыть файл)
- `F` -> jump-to-char (переход к файлу по первой букве)
- `c a a` -> archive, `c a p` -> archive + пароль, `c a h` -> + шифрование заголовка, `c a l` -> уровень сжатия, `c a u` -> всё вместе
- превью PDF через `poppler` (`pdftoppm`)

## Плагины

Пакетные зависимости описаны в `package.toml`. На свежей машине восстановить:

```sh
ya pkg install
```

Авто-бэкапы `*.toml-*` в git не отслеживаются (см. корневой `.gitignore`).