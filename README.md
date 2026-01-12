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

## keybindings

All dotfiles are configured for a Colemak keyboard layout.

`jk -> ne`

## tmux

After a fresh install, reload the config if needed:

```sh
tmux source ~/.tmux.conf
```
