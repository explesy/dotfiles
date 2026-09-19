import { createServer } from "node:http";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const bridgeSource = join(
	process.cwd(),
	"node_modules",
	"@estebanforge",
	"pi-antigravity-bridge",
	"src",
	"approval-hook.ts",
);
const dir = mkdtempSync(join(tmpdir(), "pi-bridge-hook-test-"));

async function runCase(name, hookScriptSource, responder) {
	const server = createServer(responder);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = server.address().port;
	const scriptPath = join(dir, `${name.replaceAll(" ", "-")}.mjs`);
	writeFileSync(scriptPath, hookScriptSource({ port, token: "test-token", deadlineMs: 1_000 }));

	const child = spawn(process.execPath, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
	child.stdin.end(JSON.stringify({ toolCall: { name: "run_command", args: {} } }));
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk) => {
		stdout += chunk;
	});
	child.stderr.on("data", (chunk) => {
		stderr += chunk;
	});
	const exitCode = await new Promise((resolve) => child.once("close", resolve));
	await new Promise((resolve) => server.close(resolve));

	if (exitCode !== 0 || stderr) throw new Error(`${name}: exit=${exitCode}, stderr=${stderr}`);
	const result = JSON.parse(stdout);
	if (result.decision !== "deny" || result.reason !== "no active antigravity turn") {
		throw new Error(`${name}: expected full deny object, received ${JSON.stringify(stdout)}`);
	}
	console.log(`${name}: full deny object preserved`);
}

try {
	const sourceCopy = join(dir, "approval-hook.mts");
	// Node refuses to strip TypeScript located under node_modules; importing a
	// temporary copy exercises the installed source without editing it.
	copyFileSync(bridgeSource, sourceCopy);
	const { hookScriptSource } = await import(pathToFileURL(sourceCopy).href);

	await runCase("direct terminal response", hookScriptSource, (_request, response) => {
		response.setHeader("content-type", "application/json");
		response.end(JSON.stringify({ decision: "deny", reason: "no active antigravity turn" }));
	});
	await runCase("polled terminal response", hookScriptSource, (request, response) => {
		response.setHeader("content-type", "application/json");
		if (request.url === "/approval") response.end(JSON.stringify({ ticket: "ticket-1" }));
		else response.end(JSON.stringify({ decision: "deny", reason: "no active antigravity turn" }));
	});
} finally {
	rmSync(dir, { recursive: true, force: true });
}
