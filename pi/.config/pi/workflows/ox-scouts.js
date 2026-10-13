// Experimental Pi orchestration: parallel, read-only scouting only.
// pi-subagents executes this file as a workflow statement body with args/runs.
const task = typeof args.task === "string" ? args.task.trim() : "";
if (!task) throw new Error("/ox requires a concrete task or GitHub issue reference.");

const [code, risks] = await runs.all([
  {
    key: "ox-code-scout",
    agent: "scout",
    task: [
      "READ-ONLY SCOUT A: Locate the minimal code surface for the task below.",
      "Trace confirmed entrypoints, call paths, functions, contracts and dependencies.",
      "Find exact file paths and symbols; do not modify anything or run commands.",
      "Return a focused handoff (up to ~450 words): verified findings, assumptions, unknowns.",
      "TASK:",
      task,
    ].join("\n"),
  },
  {
    key: "ox-risks-scout",
    agent: "scout",
    task: [
      "READ-ONLY SCOUT B: Independently analyze verification and regression risk for the task below.",
      "Find existing tests, relevant invariants, compatibility/security/state/data concerns,",
      "and the smallest reliable checks needed. Cite paths and symbols.",
      "Do not edit files or run commands. Avoid a general repository tour.",
      "Return a focused handoff (up to ~450 words): verified findings, risks, tests, unknowns.",
      "TASK:",
      task,
    ].join("\n"),
  },
]);

if (!code?.ok || !risks?.ok) {
  throw new Error(
    `Parallel scouting incomplete: code=${code?.ok ? "ok" : "failed"}, ` +
    `risks=${risks?.ok ? "ok" : "failed"}. Do not implement from incomplete evidence.`
  );
}

return [
  "EXPERIMENT /ox — PARALLEL SCOUT HANDOFF",
  "TASK:", task,
  "\nCODE SCOUT:", code.output || "(no findings)",
  "\nRISKS & TESTS SCOUT:", risks.output || "(no findings)",
  "\nThe two reports are evidence, not an approved implementation plan.",
  "Verify conflicting claims before editing. Continue in the parent session as sole writer.",
].join("\n");
