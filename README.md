# dotfiles

Personal dotfiles and app configs. Most folders are stow-ready; some are notes or app-specific layouts.

## Contents

- aerospace
- alacritty
- codex (local MCP notes and runbooks)
- code
- docker (notes for fresh install)
- fish (includes `eza` and `zoxide` integrations)
- ghostty
- karabiner
- kanata
- lazy_nvim
- iina
- mpv
- opencode
- ranger
- starship
- tmux
- userscripts
- wezterm
- yazi
- zellij
- zsh

## install

From this repo root:

```sh
stow <folder>
```

## homebrew

`brew-cask-upgrade` (`brew cu`) - апгрейдит все устаревшие GUI-приложения/бинарники, установленные через Homebrew Cask.

```sh
brew tap buo/cask-upgrade
brew cu [CASK]
brew untap buo/cask-upgrade
```

## fish

Abbreviations:

- `ls` -> `eza`
- `ll` -> `eza -la --sort=type`
- `lg` -> `lazygit`
- `ld` -> `lazydocker`
- `dcu` -> `docker compose up`
- `dcd` -> `docker compose down`
- `clr` -> `clear`
- `v` -> `nvim .`
- `buu` -> `brew update; and brew upgrade`

Functions:

- `yy` -> launch `yazi` and `cd` into its last directory on exit
- `c` -> copy command output to clipboard

## yazi

Current local setup:

- `i` -> smart enter: enter a directory or open the hovered file
- `F` -> jump to next file by first character
- `c`+`a` -> archive selected files (via `compress` plugin):
  - `c a a` archive, `c a p` archive with password, `c a h` password + header
    encryption, `c a l` custom compression level, `c a u` password + header + level
- PDF preview works via `poppler` (`pdftoppm`)
- flavor is force-locked to `gruvbox-dark` in both light and dark mode
  (`theme.toml`)

Package-managed plugins:

- `yazi-rs/plugins:smart-enter`
- `yazi-rs/plugins:jump-to-char`
- `KKV9/compress`

If plugins need to be restored on a fresh machine:

```sh
ya pkg install
```

## keybindings

All dotfiles are configured for a Colemak keyboard layout.

`jk -> ne`

## tmux

After a fresh install, reload the config if needed:

```sh
tmux source ~/.tmux.conf
```

Pane navigation (Colemak-friendly):

- `prefix` + `h` left
- `prefix` + `n` down
- `prefix` + `e` up
- `prefix` + `i` right

`allow-passthrough` is enabled so Yazi can show image previews inside tmux;
`TERM` (`TERM_PROGRAM`, `TERM_PROGRAM_VERSION`) refreshes from the outer
terminal on every new connection (via `update-environment`).

Восстановление сессий (tmux-resurrect):

```sh
# save
prefix + Ctrl-s

# restore
prefix + Ctrl-r
```

## iina

Keybindings live in `~/Library/Application Support/com.colliderli.iina/input_conf/doc.conf`.

```sh
stow iina
defaults write com.colliderli.iina currentInputConfigName -string doc
```

## codex

This folder stores local notes about the Codex desktop setup and MCP inventory.

- `codex/README.md` -> high-level overview of the local MCP stack
- `codex/mcp.md` -> detailed inventory and runbook

## userscripts

Userscripts for browser extensions (Violentmonkey/Tampermonkey):

- `metube-youtube.user.js` -> MeTube YouTube downloader improvements

## opencode

Глобальная конфигурация OpenCode (модели, агенты, permissions, TUI).
Подробности — в `opencode/README.md`.
