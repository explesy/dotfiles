if status is-interactive
    # Commands to run in interactive sessions can go here

    set -g fish_greeting # disable greeting message
    abbr -a ls exa
    abbr -a ll exa -la --sort=type
end
