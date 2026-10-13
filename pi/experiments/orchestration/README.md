# Pi orchestration experiment (opt-in)

This experiment adds `/ox <task or #issue>` without modifying `/n`, `/i`, `/p`, `/c`, their routing, the existing agents, or the GitHub issue queue.

## Implementation

- `pi/.config/pi/prompts/ox.md` is a **top-level** prompt template, so Pi discovers `/ox` after `stow pi` and `/reload` (or restarting Pi). Pi prompt discovery is non-recursive.
- `pi/.config/pi/workflows/ox-scouts.js` runs **two** independent, read-only `scout` children in parallel with the installed `pi-subagents` workflow API (`await runs.all([...])`). It returns a combined handoff and aborts on child failure.
- The parent Pi session keeps its selected model and is the **sole code writer**. It tests the result and asks the existing cheap `reviewer` for one independent, read-only pass on non-trivial changes.
- `/ox` does not auto-pick/close/reorder GitHub Issues and does not push/merge/deploy. No expensive plan reviewer is auto-invoked.
- This is **not** concurrent multi-writer development and does not claim isolated worktrees. Try that only if the first experiment shows a benefit and after defining safe merge/conflict handling.

## A/B protocol

Run similar, independent tasks on separate clean branches/worktrees (avoid executing the same change twice in one worktree). Compare a normal `/i <issue>` or manual task run against `/ox <same-sized task>`.

Record: start/end times, child count, model routing, tokens/cost if observable, implementation/tests/review result, human interventions, and whether the diff satisfies acceptance criteria. Record absent telemetry as `unavailable`, never invent a measurement. Use at least three comparable tasks before drawing conclusions; different issues are not perfectly controlled A/B samples.

## Local deployment and validation

1. Pull the dotfiles updates, ensure `pi/.config/pi/prompts/ox.md` and `pi/.config/pi/workflows/ox-scouts.js` are stowed under `$PI_CODING_AGENT_DIR`, then run `/reload` or restart Pi.
2. Confirm `/ox` appears in command completion. Run `/subagents-doctor` if available for the installed package, then try `/ox <small concrete issue or task>` on a clean test branch.
3. Verify exactly two parallel `scout` children ran, the parent was the only writer, tests and one cheap review ran when warranted, and no issue/queue was automatically closed or changed.
4. To disable, simply do not invoke `/ox`; remove the two new files to remove it entirely. Existing commands need no rollback.

## Validation boundaries

The workflow script can be syntax-checked and unit-tested with mocked `runs.all` without starting Pi. End-to-end child execution, slash command discovery on the user's Mac, subscription routing, and actual quota usage require a live local Pi smoke test; repository inspection alone cannot certify them.

Sources: https://pi.dev/docs/latest/prompt-templates and https://github.com/nicobailon/pi-subagents/blob/main/docs/workflows.md
