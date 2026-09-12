---
description: Review the current implementation plan with GPT-5.6 Terra before coding
---

This command is an explicit request to run exactly one GPT-5.6 Terra pre-implementation review of the plan from the CURRENT parent session.

Do not perform the independent review yourself and do not choose a plan from repository documents.

The `plan-reviewer` subagent starts with a fresh child context and cannot see this conversation. Before delegating, construct a self-contained review brief from the current session.

The brief MUST begin with:

`RUN_PLAN_REVIEW: true`

Then include these sections:

`CURRENT TASK:`
- State the exact user problem/request we are solving now.
- Preserve the current scope, acceptance criteria, and material user intent.

`PROPOSED PLAN:`
- Include the latest implementation plan from this conversation that we are actually about to implement.
- Preserve concrete files, symbols, steps, sequencing, and decisions when known.
- Do not substitute an older repository plan, TODO, design document, issue, or roadmap.

`CURRENT DECISIONS AND CONSTRAINTS:`
- Include material decisions already established in this conversation.
- Include compatibility, migration, rollout, cost, security, or operational constraints when relevant.

`RELEVANT CODE CONTEXT:`
- Include only the known files, symbols, call paths, current behavior, and evidence needed to orient the reviewer.
- Keep this concise. The reviewer can inspect the repository independently.

`EXPECTED REVIEW SCOPE:`
- Give a one-line description of the exact task/plan target the returned review must refer to.

If CURRENT TASK or PROPOSED PLAN cannot be recovered unambiguously from the current session, do not guess and do not search the repository for a replacement plan. Report that the review cannot be run because the current plan context is missing or ambiguous.

Delegate the completed brief exactly once to `plan-reviewer`.

After the reviewer returns:
- verify that its `REVIEW_SCOPE` matches CURRENT TASK and PROPOSED PLAN;
- discard any finding that clearly belongs to a different task or historical plan;
- incorporate valid corrections into the current plan;
- clearly report whether the plan is approved or needs revision;
- do not begin implementation yet.
