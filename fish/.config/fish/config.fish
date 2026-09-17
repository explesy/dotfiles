# Docker CLI path
if test -d /Users/doc/.docker/bin
    fish_add_path /Users/doc/.docker/bin
end

if status is-interactive
    # Commands to run in interactive sessions can go here

    set -g fish_greeting # disable greeting message
    set -gx EDITOR nvim
    set -gx PATH /opt/homebrew/bin $PATH
    fish_add_path $HOME/.local/bin
    set -x HOMEBREW_NO_AUTO_UPDATE 1

    abbr -a ls eza
    abbr -a ll eza -la --sort=type
    abbr -a lg lazygit
    abbr -a ld lazydocker
    abbr -a dcu docker compose up
    abbr -a dcd docker compose down
    abbr -a clr clear
    abbr -a v nvim .
    abbr -a bu 'brew update'
    abbr -a buu 'brew update; and brew upgrade'
end

# function to run yazi as yy
function yy
    set tmp (mktemp -t "yazi-cwd.XXXXXX")
    yazi $argv --cwd-file="$tmp"
    if set cwd (cat -- "$tmp"); and [ -n "$cwd" ]; and [ "$cwd" != "$PWD" ]
        cd -- "$cwd"
    end
    rm -f -- "$tmp"
end

starship init fish | source
zoxide init fish | source

function c
    command $argv | pbcopy
end

# Added by LM Studio CLI (lms)
if test -d /Users/doc/.cache/lm-studio/bin
    fish_add_path /Users/doc/.cache/lm-studio/bin
end

# Antigravity CLI
if test -d /Users/doc/.antigravity/antigravity/bin
    fish_add_path /Users/doc/.antigravity/antigravity/bin
end

# OpenClaw Completion
if test -f /Users/doc/.openclaw/completions/openclaw.fish
    source "/Users/doc/.openclaw/completions/openclaw.fish"
end

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# Project Dashboard (dd)
function dd
    set pids (lsof -ti :8787)
    if test -n "$pids"
        echo "Port 8787 is busy (PID $pids). Run: kill $pids"
        return 1
    end
    cd /Users/doc/notes/dd && uv run python serve.py --port 8787
end
abbr -a ddr 'cd /Users/doc/notes/dd && uv run python refresh.py'
abbr -a ddw 'cd /Users/doc/notes/dd && uv run python refresh.py --watch'

# OpenCode optimizations (fast boot & offline/no-hang)
set -gx OPENCODE_DISABLE_MODELS_FETCH 1
set -gx OPENCODE_DISABLE_AUTOUPDATE 1
set -gx OPENCODE_DISABLE_CLAUDE_CODE 1
set -gx OPENCODE_FAST_BOOT 1

