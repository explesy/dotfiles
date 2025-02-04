if status is-interactive
    # Commands to run in interactive sessions can go here

    set -g fish_greeting # disable greeting message
    set -gx EDITOR nvim
    set -gx PATH /opt/homebrew/bin $PATH
    set -x HOMEBREW_NO_AUTO_UPDATE 1

    abbr -a ls eza
    abbr -a ll eza -la --sort=type
    abbr -a lg lazygit
    abbr -a ld lazydocker
    abbr -a dcu docker compose up
    abbr -a dcd docker compose down
    abbr -a clr clear
    abbr -a v nvim .
    abbr -a nv nvim
    abbr -a av NVIM_APPNAME=astronvim nvim
    abbr -a buu brew update && brew upgrade

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

# Added by LM Studio CLI (lms)
set -gx PATH $PATH /Users/doc/.cache/lm-studio/bin

# Added by Windsurf
fish_add_path /Users/doc/.codeium/windsurf/bin
