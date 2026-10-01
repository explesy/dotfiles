// pi-subagents workflow body. The host supplies frozen args and runs.
const task = typeof args.task === "string" ? args.task.trim() : "";
if (!task) throw new Error("A concrete task is required.");

const draft = await runs.run("plan-draft", { agent: "planner", task });
if (!draft.ok) throw new Error("Planner failed; no plan is ready for review.");

const review = await runs.run("plan-review", {
  agent: "plan-reviewer",
  task: `RUN_PLAN_REVIEW: true\n\nCURRENT TASK\n${task}\n\nPROPOSED PLAN\n${draft.output}`,
});
if (!review.ok) throw new Error("Plan review failed; the plan is not approved.");
const verdicts = [...review.output.matchAll(/^PLAN_VERDICT: (approve|revise|insufficient-context)\s*$/gm)];
if (verdicts.length !== 1) throw new Error("Review must return exactly one valid PLAN_VERDICT.");
const verdict = verdicts[0][1];
if (verdict === "insufficient-context") return review.output;
if (verdict === "approve") return `${draft.output}\n\nReview verdict: approve`;

const revised = await runs.run("plan-revise", {
  agent: "planner",
  task: `Produce a corrected final implementation plan. Address blocking and important findings, but do not blindly accept weak suggestions. Do not implement or edit files.\n\nCURRENT TASK\n${task}\n\nORIGINAL PLAN\n${draft.output}\n\nFULL REVIEW\n${review.output}`,
});
if (!revised.ok) throw new Error("Plan revision failed; no final plan is ready.");
return `${revised.output}\n\nReview verdict: revise; plan corrected after review.`;
