# Use powerline
USE_POWERLINE="true"
# Source manjaro-zsh-configuration
if [[ -e /usr/share/zsh/manjaro-zsh-config ]]; then
  source /usr/share/zsh/manjaro-zsh-config
fi
# Use manjaro zsh prompt
if [[ -e /usr/share/zsh/manjaro-zsh-prompt ]]; then
  source /usr/share/zsh/manjaro-zsh-prompt
fi

# My config
alias tmuxn='tmux new -s'
alias tmuxa='tmux a -t'
alias uvim='nvim -u /home/doc/.config/uvim/init.lua'
alias tlfz='tldr --list | fzf --preview "tldr {1} --color=always" --preview-window=right,70% | xargs tldr'

cdls() {
        cd "$@" && ls;
}

export VISUAL=nvim
export EDITOR="$VISUAL"
