if status is-interactive
    set -g fish_greeting # disable greeting

    # Editor & tooling defaults
    set -gx EDITOR nvim
    set -gx HOMEBREW_NO_AUTO_UPDATE 1

    # PATH: единый источник через fish_add_path (дедупликация + prepend).
    # Порядок вызовов важен: последний оказывается в начале PATH.
    fish_add_path /opt/homebrew/bin
    fish_add_path $HOME/.local/bin
    if test -d $HOME/.docker/bin
        fish_add_path $HOME/.docker/bin
    end
    if test -d $HOME/.cache/lm-studio/bin
        fish_add_path $HOME/.cache/lm-studio/bin
    end
    if test -d $HOME/.antigravity/antigravity/bin
        fish_add_path $HOME/.antigravity/antigravity/bin
    end
    # bun — в самом конце, чтобы его bin оказался в начале PATH
    set --export BUN_INSTALL "$HOME/.bun"
    fish_add_path "$BUN_INSTALL/bin"

    # Abbreviations
    abbr -a ls eza
    abbr -a ll 'eza -la --sort=type'
    abbr -a lg lazygit
    abbr -a ld lazydocker
    abbr -a dcu 'docker compose up'
    abbr -a dcd 'docker compose down'
    abbr -a clr clear
    abbr -a v nvim .
    abbr -a bu 'brew update'
    abbr -a buu 'brew update; and brew upgrade'
    abbr -a ag agy
    abbr -a agc 'agy --continue'
    abbr -a agp 'agy --mode plan'
end

# yazi: остаться в каталоге, в который перешли внутри yazi
function yy
    set tmp (mktemp -t "yazi-cwd.XXXXXX")
    yazi $argv --cwd-file="$tmp"
    if set cwd (cat -- "$tmp"); and [ -n "$cwd" ]; and [ "$cwd" != "$PWD" ]
        cd -- "$cwd"
    end
    rm -f -- "$tmp"
end

# скопировать вывод команды в буфер обмена
function c
    command $argv | pbcopy
end

starship init fish | source
zoxide init fish | source

# OpenClaw completions
if test -f $HOME/.openclaw/completions/openclaw.fish
    source "$HOME/.openclaw/completions/openclaw.fish"
end

# OpenCode optimizations (fast boot & offline/no-hang)
set -gx OPENCODE_DISABLE_MODELS_FETCH 1
set -gx OPENCODE_DISABLE_AUTOUPDATE 1
set -gx OPENCODE_DISABLE_CLAUDE_CODE 1
set -gx OPENCODE_FAST_BOOT 1