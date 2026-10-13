---
description: Experimental parallel scouting + single-writer implementation + review (isolated from /n and /i)
argument-hint: "<task or #issue>"
---

EXPERIMENTAL ORCHESTRATION (`/ox`). This is an opt-in A/B experiment, NOT `/n`, `/i`, `/p`, or `/c`. Do not call or modify those commands. Keep the current model and thinking level, and do not change agent mappings or project backlog/queue.

TASK: ${ARGUMENTS:-Use the concrete task already specified in this conversation. If there is no unambiguous task, request one; never select an issue automatically.}

Run this experiment end-to-end, but do not widen the requested scope:

1. Confirm the working directory is the intended Git repository. Inspect `git status` and the relevant repository instructions, and preserve unrelated modifications. If TASK refers to a GitHub issue, read it and obey its acceptance criteria and blocked/gated/dependency restrictions. Stop on an actual blocker. Do not auto-select a different issue.
2. Resolve the existing global workflow file to an absolute path: `$PI_CODING_AGENT_DIR/workflows/ox-scouts.js`, or `~/.config/pi/workflows/ox-scouts.js` if the environment variable is unset. Submit **one** foreground `subagent` call with `workflow` equal to that absolute file path, `args: { task: "<the exact concrete task and any issue context needed>" }`, `async: false`, and `options: { context: "fresh" }`. Do not use removed `workflowScript`/`workflowScriptPath`, top-level `parallel`/`tasks`, `workflow: true`, or `clarify`. The workflow starts two read-only `scout` children concurrently using `runs.all`. If the tool fails or either child fails, report the failure and stop rather than pretending scouting succeeded.
3. Merge the two scout reports into a small implementation plan grounded in verified code, cross-check contradictions, and explicitly identify any missing essential decision. No automatic expensive planner/plan-reviewer escalation in this experiment. If implementation would be unsafe without an important decision, report the blocker rather than guessing.
4. **You are the only writer.** Implement the task in this parent Pi session using the existing selected main model. Do not launch writing subagents, do not change unrelated files, do not silently change user model/routing configuration. Do not impose a small hard step limit or stop at an intermediate milestone.
5. Run focused tests/checks, then broader checks only if warranted. After non-trivial changes, run exactly one independent `subagent` call with `agent: "reviewer"`, `options: { context: "fresh" }`, `async: false` and a self-contained brief: task, acceptance criteria, changed files/diff, completed tests and known risks. `reviewer` is read-only. Fix valid blocking/important findings and re-run affected tests. No endless review cycle and no automatic expensive reviewer.
6. Do not automatically push, merge, deploy, close the issue, or advance GitHub execution queues. Follow any stricter repository/user approval boundaries. Report what was actually completed, tests and review verdict, remaining blockers, and a brief A/B measurement note: wall-clock elapsed and tokens/cost only if reliably available (otherwise say unavailable). Do not claim a live test passed without evidence.

Keep the result practical and concise: human outcome first, technical evidence second. This is a separate experiment; the established workflows remain unchanged.
