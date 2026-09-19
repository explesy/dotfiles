---
description: Execute exactly one next SakuSaku queue item end-to-end
argument-hint: "[instruction]"
---

Execute exactly one next task from the canonical SakuSaku execution queue in
`explesy/roman_ac_01`.

Additional instruction from me:
${ARGUMENTS:-None.}

Do not implement the task directly in the parent Pi session. Use exactly one
foreground `subagent` call with `async: false`, `clarify: false`, and a
`workflowScript` that performs this sequence:

1. Run `next-worker` in IMPLEMENT mode.
   - It must fetch live GitHub issue #21, select the first unfinished item under
     "Strict execution order", fetch that issue in full, implement only that
     issue, and run the required verification.
   - It must not commit, push, close the issue, or advance the queue yet.
   - Pass the additional instruction above as a constraint, not as permission to
     skip queue ordering unless I explicitly say to do so.
   - Use workflow key `next-implement`.

2. If IMPLEMENT returns `IMPLEMENTATION_STATUS: blocked` or `no-task`, stop
   immediately and return its report. Do not fabricate progress or pick a
   different issue.

3. If ready for review, run `delivery-reviewer` once.
   - Give it the selected issue/task, acceptance criteria, the worker's full
     review brief, and tell it to inspect the actual working-tree diff.
   - Use workflow key `next-review`.

4. Branch on the review verdict:
   - `DELIVERY_VERDICT: approve` → run a fresh `next-worker` in FINALIZE mode
     with the selected issue pinned and the implementation/review briefs.
   - `DELIVERY_VERDICT: revise` → run a fresh `next-worker` in
     FIX_AND_FINALIZE mode with the selected issue pinned and the full review.
     It should fix concrete blocking/important findings, verify again, then
     finalize. Do not run a second independent review loop.
   - `DELIVERY_VERDICT: blocked` → stop without commit/push/issue/queue changes.

5. Finalization is allowed to advance exactly one queue item and only after
   verification succeeds:
   - re-fetch #21 to detect concurrent queue changes;
   - update required repository docs/version/changelog;
   - commit only the selected issue's work and push only as a normal fast-forward
     on the expected tracked default branch;
   - only after successful push, close the selected issue, mark it complete in
     #21, move `current` and `next` labels, and update the compact handoff;
   - if manual/external evidence is still required, leave the issue and queue
     open and report the blocker.

Use stable workflow keys `next-implement`, `next-review`, and
`next-finalize` (the last key is also used for the fix-and-finalize branch).

The final response to me must be concise and contain:
- which issue was selected;
- what changed and why;
- verification/review result;
- commit/push/issue state;
- the new current/next queue items if the queue advanced;
- any blocker that prevented full completion.

Never continue automatically into the following issue. One `/n` invocation
means one queue item.
