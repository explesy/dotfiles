# Pi orchestration experiment (opt-in)

This experiment adds `/ox <task or #issue>` with its own orchestration, without selecting or changing the GitHub issue queue. It uses the shared `reviewer` instructions. The October 13 follow-up also improves the shared `/n` and `/i` verification/risk instructions; model selection and review agent counts stay unchanged.

## Implementation

- `pi/.config/pi/prompts/ox.md` is a **top-level** prompt template, so Pi discovers `/ox` after `stow pi` and `/reload` (or restarting Pi). Pi prompt discovery is non-recursive.
- `pi/.config/pi/workflows/ox-scouts.js` runs **two** independent, read-only `scout` children in parallel with the installed `pi-subagents` workflow API (`await runs.all([...])`). It returns a combined handoff and aborts on child failure.
- The parent Pi session keeps its selected model and is the **sole code writer**. It tests the result and asks the existing cheap `reviewer` for one independent, read-only pass on non-trivial changes.
- `/ox` does not auto-pick/close/reorder GitHub Issues and does not push/merge/deploy. No expensive plan reviewer is auto-invoked.
- This is **not** concurrent multi-writer development and does not claim isolated worktrees. Try that only if the first experiment shows a benefit and after defining safe merge/conflict handling.

## A/B protocol

For a controlled comparison, run the same frozen task from the same source SHA in two independent clones with fresh sessions. Worktrees share Git history and may expose the other implementation's commits. Keep the other result and the external acceptance inputs out of each agent's context. Record any shared dependencies and uncontrolled run-order/cache effects.

Record: start/end times, child count, model routing, tokens/cost if observable, implementation/tests/review result, human interventions, and whether the diff satisfies acceptance criteria. Record absent telemetry as `unavailable`, never invent a measurement. Use at least three comparable tasks before drawing conclusions; different issues are not perfectly controlled A/B samples.

## Adaptive `/ix` experiment

`pi/.config/pi/prompts/ix.md` adds `/ix <task or #issue>` as a separate top-level prompt. The selected main model/thinking is preserved and the parent remains the sole writer. An ordinary task has no mandatory scouting or independent plan review; a non-trivial implementation still gets one cheap code review. Risky work retains the configured Luna planner → Sol plan review and Sol code review route. New material risk found by cheap code review may receive one focused Sol escalation.

For one specific unknown repository question, `/ix` may call `ix-scout` once. This separate role uses the existing MiMo/low model, read-only project tools, a 250-word handoff and an eight-tool-call instruction. The budget is not runtime-enforced. Missing evidence or budget overrun must remain visible; it is not proof that scouting succeeded. The existing shared `scout` and `/ox` two-scout workflow are unchanged.

The next comparison is `/i` versus `/ix` with DeepSeek/high and the same role models, frozen task/source/dependencies and one exact Node installation. It tests omission of ordinary plan review and optional scouting, not different models. Model experiments must be separate: one role or effort change per comparison, with shared inputs and evidence. Offline catalog discovery does not prove provider authentication or performance.

See [model experiment hypotheses and sequence](models.md) for the observations from the three saved case studies and separate scout/reviewer/writer comparisons.

After the third case study, acceptance maps in `/n`, `/i`, `/ox`, `/ix` and shared code reviewers distinguish `verified`, `verification-gap`, `contract-exception`, and `not-implemented`. Documenting/testing a limitation cannot authorize narrowing the original requirement. This shared update affects other commands that use those reviewers.

Use `/reload` or restart to load `/ix` and its role. Prompt/agent discovery and routing can be checked locally without an inference request; actual delegation, adherence to the scout budget, and effectiveness require a live run.

## Follow-up after two case studies (2026-10-13)

Both workflows must capture actual check exit codes and finish with a compact requirement → implementation → verification map after review fixes. Required repository checks still run when a known baseline failure exists; repeated baseline diagnosis needs changed evidence or unavailable prior evidence. Reviewer instructions prioritize acceptance violations and contract-valid exceptional paths; a confirmed requirement violation is at least important even when rare.

`/ox` uses scouts' file/symbol map for focused reading, repeating investigation only for an identified gap or contradiction. Its two scouts and one cheap code review stay unchanged. `/n` and `/i` classify changes to concurrency/shared-state invariants rather than the presence of a cache; new shared counters still need assessment, and material uncertainty retains the risky route. Luna/Sol escalation is preserved.

Existing Pi sessions need `/reload` or restart to load revised instructions. These are prompt policies, not enforced test gates; a new measured run is needed to establish their effect. Shared reviewer changes also affect other commands that invoke those agents.

## Local deployment and validation

1. Pull the dotfiles updates, ensure `pi/.config/pi/prompts/ox.md` and `pi/.config/pi/workflows/ox-scouts.js` are stowed under `$PI_CODING_AGENT_DIR`, then run `/reload` or restart Pi.
2. Confirm `/ox` appears in command completion. Run `/subagents-doctor` if available for the installed package, then try `/ox <small concrete issue or task>` on a clean test branch.
3. Verify exactly two parallel `scout` children ran, the parent was the only writer, tests and one cheap review ran when warranted, and no issue/queue was automatically closed or changed.
4. To disable, simply do not invoke `/ox`; remove the two new files to remove it entirely. Existing commands need no rollback.

## Validation boundaries

The workflow script can be syntax-checked and unit-tested with mocked `runs.all` without starting Pi. End-to-end child execution, slash command discovery on the user's Mac, subscription routing, and actual quota usage require a live local Pi smoke test; repository inspection alone cannot certify them.

Sources: https://pi.dev/docs/latest/prompt-templates and https://github.com/nicobailon/pi-subagents/blob/main/docs/workflows.md

## Impact-based verification (2026-10-13)

Shared `/n` and `/i`, plus `/ix` and `/ox`, now select checks from changed behavior, contracts and consumers. Isolated changes use focused tests and applicable build/lint; a small diff alone does not establish isolation. Full checks are reserved for releases, broad/shared changes, uncertain impact or evidence of a wider regression, while explicit repository/user requirements remain mandatory. When needed, the full suite follows review fixes. Test-only additions rerun the relevant test/file; a further full run needs a stated new reason. Reports identify coverage, gaps and actual results.

The active SakuSaku `AGENTS.md` uses the same selection policy, retains build/lint for code, the full release gate and provider/snapshot/playback checks. Saved experiment clones and frozen inputs/results retain their original instructions. This is prompt policy; runtime loading can be verified locally, but adherence and time savings require another measured run.
