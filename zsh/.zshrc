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


cdls() {
        cd "$@" && ls;
}

export VISUAL=lvim
export EDITOR="$VISUAL"

# for poetry autocompletion
fpath+=~/.zfunc
autoload -Uz compinit && compinit
