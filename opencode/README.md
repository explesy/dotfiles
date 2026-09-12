# OpenCode config — optimized Go routing (Sep 2026)

Canonical global OpenCode config for this dotfiles repository. From the repo root, `stow opencode` links `opencode/.config/opencode/` into `~/.config/opencode/`. Runtime package state (`node_modules`, `package.json`, `bun.lock`, `package-lock.json`) stays local and untracked via `.gitignore`.

The package keeps the existing safety/context controls and simplifies primary routing around current OpenCode Go economics: cheap high-throughput default work, strong planning/reasoning only where it pays off, and dedicated multimodal/design routes.

## Install

```sh
stow opencode
```

## Structure

```text
opencode.jsonc
tui.json

agents/
  cheap-explore.md
  coder.md
  reviewer.md
  hard-review.md
  plan-reviewer.md
  translator.md

commands/
  c.md
  do.md
  pr.md
  review.md
  hard.md
  simplify.md
  commit.md
  v.md
  lp.md
  ldo.md
  luna.md
  design.md

plugins/
  mode-model-router.js

tui-plugins/
  workflow-ui.tsx
```

## Primary routing

The primary-agent list is intentionally small:

- `build` — **default**, `opencode-go/deepseek-v4-flash`. Everyday implementation, debugging and refactoring. This is now the main throughput/value route.
- `plan` — `opencode-go/gpt-5.6-luna`, **high** reasoning, read-only. Use for implementation-ready planning, architecture, migrations, state/concurrency, compatibility and screenshot/PDF-aware planning.
- `quality` — `opencode-go/gpt-5.6-luna`, **high** reasoning. Explicit escalation for hard implementation/debugging, cross-cutting changes, difficult failures, or multimodal work where the default route is not enough.
- `free-build` — `opencode/nemotron-3.5-lightning-free`. Zero-Go fallback for low-risk routine work or after Go quota exhaustion.
  DeepSeek V4 Flash Free was removed from this route after current OpenCode builds began rejecting it as an invalid configured model.
- `design` — `opencode-go/glm-5.3-flash`, **high** reasoning. Screenshot/reference-driven frontend design, responsive layout, visual hierarchy and UI polish.
- `vision` — `opencode-go/qwen3.8-flash`. Economical general multimodal diagnosis and small screenshot/image-driven coding tasks.

Removed from the primary picker because they duplicated clearer routes or had poor current value:

- `go-build` — redundant now that DeepSeek V4 Flash is the default `build`.
- `go-quality` / DeepSeek V4 Pro route — no longer worth a permanent mode versus Luna quality escalation; select manually only for an occasional independent model-family check.
- `luna-build` — replaced by the clearer `quality` route.
- `luna-plan` — merged into the built-in `plan` route.
- Kimi K3 as default `design` — removed from routine design routing because its Go allowance is too small for iterative frontend work. It can still be selected manually if a specific task justifies it.

## Recommended daily workflow

Routine task:

```text
build -> automatic focused reviewer after non-trivial edits -> /commit
```

Substantial feature/change:

```text
/lp <task> -> /pr -> revise plan if needed -> /do -> implementation -> reviewer -> optional /hard -> /commit
```

If implementation is unusually difficult or the default worker gets stuck:

```text
/luna <task>
```

or, after a reviewed plan:

```text
/ldo
```

Both use `quality` = GPT-5.6 Luna High.

For UI/reference work:

```text
/design <task>
```

For a cheap visual diagnosis/small screenshot-driven fix:

```text
/v <task>
```

## Why this routing

OpenCode Go limits are dollar-based, so long agentic sessions should spend expensive reasoning only when it materially reduces retries. DeepSeek V4 Flash is the default because it combines strong current OpenCode adoption with very high request throughput. Luna High is reserved for planning and explicit quality escalation. GLM-5.3 Flash replaces Kimi K3 for normal design work because it is multimodal and much more practical for iterative sessions. Qwen3.8 Flash provides a cheaper general vision route without relying on the experimental DeepSeek vision model.

The config intentionally does **not** add every cheap/new model as a permanent mode. MiMo-V2.5, Hy3/Hy4, LongCat, Muse/Omen and newer previews can be A/B tested later, but adding them all to the primary picker would make everyday routing harder. A model earns a permanent route only when it clearly wins a real recurring role.

## Step-limit policy

Primary agents intentionally have **no `steps` cap**. OpenCode forces a text-only handoff when a configured step limit is reached, which previously caused partially completed implementations.

Bounded subagents keep their existing limits:

- `cheap-explore`: 9
- `coder`: 22
- `reviewer`: 12
- `hard-review`: 10
- `plan-reviewer`: 10
- `translator`: 6

Primary prompts treat bounded-subagent exhaustion as a handoff rather than task completion. If requested work remains and there is no genuine blocker or approval boundary, the primary agent continues.

## Subagents and quota control

The existing cheap/free child-context strategy is preserved:

- `cheap-explore` — Nemotron 3.5 Lightning Free, read-only, narrow codebase discovery.
- `coder` — Laguna S 2.1 Free, focused mechanical implementation only after scope/files are known.
- `reviewer` — MiMo-V2.5 Free, one independent first-pass post-implementation review.
- `translator` — GPT-5.6 Luna for production localization; preserves placeholders, keys, markup and technical identifiers.
- `plan-reviewer` — GPT-5.6 Terra High, manual-only independent pre-implementation review.
- `hard-review` — GPT-5.6 Terra High, manual-only escalation review.

`subagent_depth` remains `1` to avoid nested agent trees and uncontrolled context multiplication.

## Plan review

`/pr` remains a manual GPT-5.6 Terra review. It does not launch Terra with an empty context. The current primary first serializes the current task, proposed plan, decisions/constraints and concise relevant code context into a self-contained brief, then delegates exactly once to `plan-reviewer`.

`plan-reviewer` treats the supplied `PROPOSED PLAN` as the only plan being reviewed. Repository TODOs, ADRs, historical plans and comments are evidence only. If the current plan context is missing, it returns `PLAN_VERDICT: insufficient-context` instead of guessing.

The normal path is now deliberately simple:

```text
/lp -> /pr -> /do
```

`/lp` explicitly enters the real `plan` agent (Luna High). `/do` explicitly switches to the default `build` agent (DeepSeek V4 Flash), so implementation cannot accidentally remain inside the read-only plan agent.

If the reviewed plan is unusually risky/complex, use `/ldo` instead of `/do`; it switches to `quality` (Luna High).

## Hard review

`/hard` keeps the existing context-safe Terra pattern. The current primary serializes the current problem, attempted solution/hypothesis, constraints, relevant code context and unresolved question before invoking `hard-review`.

Terra reviewers remain manual-only. Primary prompts forbid automatic invocation unless the matching `RUN_PLAN_REVIEW` / `RUN_HARD_REVIEW` marker is explicitly supplied by the command.

## Design / visual frontend

`design` now uses GLM-5.3 Flash High rather than Kimi K3.

Use it when the task is materially about:

- screenshot/reference matching;
- hierarchy, spacing and typography;
- responsive layout;
- frontend component composition;
- interaction states and accessibility;
- visual polish while preserving the product's existing design language.

The visual evidence stays in the primary multimodal context. `cheap-explore` may be used only for repository discovery that does not require seeing the image. A normal post-change `reviewer` pass is still available.

Kimi K3 is intentionally not a permanent mode now. If a specific difficult visual task clearly deserves it, select it manually for that task rather than paying its low Go allowance on every design iteration.

## Vision

`vision` now uses `opencode-go/qwen3.8-flash`.

Use `/v` for screenshot/image-based diagnosis, UI state investigation, diagrams and small image-driven fixes. If the problem turns into a hard architecture/debugging task, switch to `quality`; if visual evidence stops mattering, return to `build`.

The experimental DeepSeek V4 Flash Vision model is deliberately not the default vision route yet. It is attractive on cost, but keeping an experimental model out of the core workflow avoids unnecessary routing/tool-compatibility risk until it proves itself in our real tasks.

## Commands

- `/c` — continue from the exact current state without redoing finished analysis.
- `/lp` — plan read-only with `plan` = Luna High, including screenshots/PDFs.
- `/pr` — independently review the current plan with Terra High.
- `/do` — approve the reviewed plan and implement it with default `build` = DeepSeek V4 Flash.
- `/ldo` — approve the reviewed plan and implement with `quality` = Luna High.
- `/luna` — run an ad-hoc hard task through `quality` = Luna High.
- `/review` — free MiMo independent post-implementation review.
- `/hard` — context-safe manual Terra escalation review.
- `/v` — Qwen3.8 Flash multimodal diagnosis/small visual fix.
- `/design` — GLM-5.3 Flash High visual frontend/design route.
- `/simplify` — inspect recent changes for unnecessary complexity.
- `/commit` — stage relevant files and create a local conventional commit; never push.

## TUI workflow UI

`workflow-ui.tsx` is a TUI-only presentation layer. It does not duplicate command routing or change agent/model configuration. `tui.json` loads it explicitly from `./tui-plugins/workflow-ui.tsx`.

It adds:

- a compact status beside the session prompt, e.g. `BUILD · DeepSeek V4 Flash · /wf`;
- the status is derived from the current session agent/model state, so it helps expose stale or unexpected routing;
- `/workflow` (alias `/wf`) in the TUI command palette;
- a searchable command cheat sheet for `/lp`, `/pr`, `/do`, `/ldo`, `/luna`, `/review`, `/hard`, `/design`, `/v`, `/c`, `/simplify`, and `/commit`;
- a small `/workflow commands` hint on the home prompt.

The UI plugin is intentionally separate from `plugins/mode-model-router.js`: TUI modules are target-exclusive and are loaded from `tui.json`, while the existing router is a server/runtime plugin. This UI is for the current TUI plugin system and does not add controls to OpenCode Desktop/Web.

## Desktop agent/model picker workaround

Some OpenCode Desktop builds can display or retain a stale manually selected model when switching agents. `plugins/mode-model-router.js` therefore enforces the intended model on every user turn.

Current enforced mapping:

- `build` -> DeepSeek V4 Flash (OpenCode Go)
- `plan` -> GPT-5.6 Luna High (OpenCode Go)
- `quality` -> GPT-5.6 Luna High (OpenCode Go)
- `free-build` -> Nemotron 3.5 Lightning Free
- `design` -> GLM-5.3 Flash High (OpenCode Go)
- `vision` -> Qwen3.8 Flash (OpenCode Go)

The plugin intentionally does not remap subagents; each subagent keeps its own pinned model.

The specialized workflow commands also pin agent/model (and reasoning variant where applicable), so `/lp`, `/do`, `/ldo`, `/luna`, `/design`, and `/v` are the safest entry points when the Desktop picker appears stale.

## Safety / context controls preserved

- secrets and private keys remain protected;
- destructive shell commands, dependency installs, publishing and network research still require approval;
- sharing remains disabled;
- compaction/pruning and watcher ignores remain enabled;
- normal coding remains autonomous;
- primary agents remain uncapped by small hard step limits;
- reviewer agents remain read-only;
- no nested subagent trees.
