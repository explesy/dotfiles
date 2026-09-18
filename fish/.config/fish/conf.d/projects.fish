# Project Dashboard (dd) — commands for the notes/dd project.
# Kept out of config.fish on purpose: this is a project workflow, not shell setup.

function dd
    set pids (lsof -ti :8787)
    if test -n "$pids"
        echo "Port 8787 is busy (PID $pids). Run: kill $pids"
        return 1
    end
    cd "$HOME/notes/dd" && uv run python serve.py --port 8787
end

abbr -a ddr 'cd $HOME/notes/dd && uv run python refresh.py'
abbr -a ddw 'cd $HOME/notes/dd && uv run python refresh.py --watch'