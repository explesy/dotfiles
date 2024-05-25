if status is-interactive
    # Commands to run in interactive sessions can go here

    set -g fish_greeting # disable greeting message
    set -gx EDITOR nvim

    abbr -a ls eza
    abbr -a ll eza -la --sort=type
    abbr -a lg lazygit
    abbr -a ld lazydocker
    abbr -a psh poetry shell
    abbr -a psa poetry show --all
    abbr -a pst poetry show --tree

end

starship init fish | source
