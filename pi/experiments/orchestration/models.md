# Model experiments after three Pi case studies

These are hypotheses from the saved runs, not a model leaderboard. All three
studies used DeepSeek V4.1 Flash/high as writer; they did not isolate writer
model or effort. Model availability was checked in the installed offline Pi
catalog; that alone does not prove live authentication, quotas or latency.

## Current roles and what the runs establish

| Role | Current model/effort | Evidence and next question |
|---|---|---|
| Main writer | DeepSeek V4.1 Flash/high | Completed all six original implementations at low estimated cost, with contract gaps in different results. Keep as the orchestration baseline; compare high vs low on the same ordinary task before assuming high is necessary or max is better. |
| Scout | MiMo V2.6 Flash/low | In #82, two scouts made 70/55 calls and took 10:26/6:42. Both model behavior and a broad assignment contributed; no isolated model conclusion is possible. `/ix` first narrows the question and adds an eight-call prompt budget. |
| Ordinary plan/code review | Haiku 5.5/medium | Found useful issues, including prototype-key lookups and calendar rollover, but accepted or missed contract restrictions. Keep cheap review as baseline and measure requirement defects/false positives, not approval counts. |
| Risk planning/review | Luna/high, Sol/high | The risky #80 route produced a result covering sync-throw accounting but cost much more. Planner, two plan reviews and code review were combined; their individual contribution was not isolated. Keep risk-based use rather than replacing every cheap review. |

The exact configured IDs are in `pi/.config/pi/agents/` and
`pi/.config/pi/extensions/workflow.ts`; `/ix` preserves the selected writer.

## Controlled sequence

1. **Orchestration first:** `/i` vs `/ix`, same DeepSeek/high and role models,
   exact Node runtime, source, task, dependencies and acceptance probe. This
   tests optional scouting and omission of ordinary independent plan review.
2. **Bounded scouting replay:** MiMo/low vs Haiku/medium on the same exact
   repository question, evidence supplied, tools, eight-call budget and
   250-word handoff. Use fresh read-only sessions. Score factual answer,
   correct file/symbol references, missed essentials, calls, time, cost and
   budget compliance. If a model cannot answer within the budget, retain the
   honest gap; do not compare incomplete and complete answers only by speed.
3. **Immutable patch review replay:** Haiku/medium vs Sol/high on the same
   frozen patches and original acceptance requirements. Include a defective
   and a corrected patch; keep the known findings outside reviewer context.
   Validate findings against source or equal controller probes. Measure
   missed important defects, false positives, severity calibration, time and
   cost. No writes or implementation fixes during replay.
4. **Writer effort:** DeepSeek/high vs low under the same `/ix` policy, then
   consider a different writer only if remaining defects/latency justify it.
   Keep reviewer/scout choices fixed. One case cannot establish general quality.

Do not change workflow and model together or replace all roles after one
outlier. Scout/model replay tasks are separate from the prepared cache:window
implementation comparison and have not been launched.

## Pricing and provider boundaries

Current official [OpenCode Go documentation](https://opencode.ai/docs/go/)
lists the configured DeepSeek V4.1 Flash, MiMo V2.6 Flash and Haiku 5.5 models.
It also specifies peak/off-peak DeepSeek rates and a Haiku rate change above
100K context. A model with cheap short-context rates is not necessarily a
cheap writer for a long session. Capture effective pricing/model metadata,
context sizes and provider in each run; Pi estimated cost is not an invoice
or a verified subscription-quota reading. Do not silently substitute another
provider when comparing the same model.
