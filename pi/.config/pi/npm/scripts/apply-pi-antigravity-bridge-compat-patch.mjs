import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const bridgeRoot = join(
	process.cwd(),
	"node_modules",
	"@estebanforge",
	"pi-antigravity-bridge",
);
const packagePath = join(bridgeRoot, "package.json");
const sourcePath = join(bridgeRoot, "src", "approval-hook.ts");
const bridgeVersion = JSON.parse(readFileSync(packagePath, "utf8")).version;

if (bridgeVersion !== "1.6.0") {
	throw new Error(
		`Refusing to patch pi-antigravity-bridge ${bridgeVersion}; this compatibility patch targets exactly 1.6.0.`,
	);
}

const replacements = [
	{
		name: "direct terminal decision",
		before: "\t\tconsole.log(JSON.stringify(json.decision));",
		after: "\t\tconsole.log(JSON.stringify(json));",
	},
	{
		name: "polled terminal decision",
		before:
			'\t\t\tconsole.log(JSON.stringify(json.decision ?? { decision: "deny", reason: "gate returned no decision" }));',
		after: `\t\t\tconsole.log(\n\t\t\t\tJSON.stringify(\n\t\t\t\t\tjson && typeof json === "object" && "decision" in json\n\t\t\t\t\t\t? json\n\t\t\t\t\t\t: { decision: "deny", reason: "gate returned no decision" },\n\t\t\t\t),\n\t\t\t);`,
	},
];

let source = readFileSync(sourcePath, "utf8");
let changed = false;

for (const { name, before, after } of replacements) {
	if (source.includes(after)) continue;
	const occurrences = source.split(before).length - 1;
	if (occurrences !== 1) {
		throw new Error(`Refusing to patch ${name}: expected one known upstream expression, found ${occurrences}.`);
	}
	source = source.replace(before, after);
	changed = true;
}

if (changed) writeFileSync(sourcePath, source);
console.log(`pi-antigravity-bridge ${bridgeVersion}: compatibility patch ${changed ? "applied" : "already applied"}.`);
