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
- ranger
- starship
- tmux
- uvim
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
- PDF preview works via `poppler` (`pdftoppm`)

Package-managed plugins:

- `yazi-rs/plugins:smart-enter`
- `yazi-rs/plugins:jump-to-char`

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
