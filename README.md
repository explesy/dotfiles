# dotfiles

Personal dotfiles and app configs. Most folders are stow-ready; some are notes or app-specific layouts.

## Contents

- aerospace
- alacritty
- code
- docker (notes for fresh install)
- fish (includes `eza` and `zoxide` integrations)
- ghostty
- karabiner
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
- `av` -> `NVIM_APPNAME=astronvim nvim`
- `buu` -> `brew update; and brew upgrade`

Functions:

- `yy` -> launch `yazi` and `cd` into its last directory on exit
- `c` -> copy command output to clipboard

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
