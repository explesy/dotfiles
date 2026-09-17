# Path configuration
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
if [[ -d "$HOME/.antigravity/antigravity/bin" ]]; then
  export PATH="$HOME/.antigravity/antigravity/bin:$PATH"
fi

# Use powerline (if on Linux/Manjaro)
USE_POWERLINE="true"
if [[ -e /usr/share/zsh/manjaro-zsh-config ]]; then
  source /usr/share/zsh/manjaro-zsh-config
fi

# Aliases
alias tmuxn='tmux new -s'
alias tmuxa='tmux a -t'

if command -v eza >/dev/null 2>&1; then
  alias ls='eza'
  alias ll='eza -la --sort=type'
elif command -v exa >/dev/null 2>&1; then
  alias ls='exa -la --sort=type'
  alias ll='exa -la --sort=type'
fi

alias bu='brew update'
alias buu='brew update && brew upgrade'

cdls() {
  cd "$@" && ls
}

export VISUAL=nvim
export EDITOR="$VISUAL"

# for poetry autocompletion
fpath+=~/.zfunc
autoload -Uz compinit && compinit

# enable starship
if command -v starship >/dev/null 2>&1; then
  eval "$(starship init zsh)"
fi

# OpenCode optimizations (fast boot & offline/no-hang)
export OPENCODE_DISABLE_MODELS_FETCH=1
export OPENCODE_DISABLE_AUTOUPDATE=1
export OPENCODE_DISABLE_CLAUDE_CODE=1
export OPENCODE_FAST_BOOT=1

