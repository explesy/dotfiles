import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4.1-flash";
const HERDSMAN_COORDINATION_TOOLS = new Set(["agent", "chief", "staff"]);

export default function workflowCommands(pi: ExtensionAPI) {
  let buildToolsBeforeRun: string[] | undefined;

  const restoreBuildTools = () => {
    if (!buildToolsBeforeRun) return;

    pi.setActiveTools(buildToolsBeforeRun);
    buildToolsBeforeRun = undefined;
  };

  pi.on("agent_end", restoreBuildTools);
  pi.on("session_shutdown", restoreBuildTools);

  const runBuild = async (args: string, ctx: ExtensionCommandContext) => {
    const model = ctx.modelRegistry.find(BUILD_PROVIDER, BUILD_MODEL);
    if (!model) {
      ctx.ui.notify(
        `Build model not found: ${BUILD_PROVIDER}/${BUILD_MODEL}`,
        "error",
      );
      return;
    }

    const ok = await pi.setModel(model);
    if (!ok) {
      ctx.ui.notify(
        `No authentication configured for ${BUILD_PROVIDER}/${BUILD_MODEL}`,
        "error",
      );
      return;
    }

    const task = args.trim();
    if (task) {
      const activeTools = pi.getActiveTools();

      // pi-herdsman exposes its coordination tools with root `anyOf` schemas.
      // Some Console Go routes reject those schemas before the model sees the
      // request, even though the rest of the tool surface is valid. /build is
      // a single-agent build command, so omit only optional Herdsman
      // coordination tools for its one turn.
      if (activeTools.some((tool) => HERDSMAN_COORDINATION_TOOLS.has(tool))) {
        buildToolsBeforeRun = activeTools;
        pi.setActiveTools(
          activeTools.filter((tool) => !HERDSMAN_COORDINATION_TOOLS.has(tool)),
        );
      }

      try {
        pi.sendUserMessage(task);
      } catch (error) {
        restoreBuildTools();
        throw error;
      }
      return;
    }

    ctx.ui.notify(`Build model: ${BUILD_PROVIDER}/${BUILD_MODEL}`, "info");
  };

  pi.registerCommand("build", {
    description:
      "Switch to DeepSeek V4.1 Flash build model and optionally run a task",
    handler: runBuild,
  });

  pi.registerCommand("b", {
    description: "Alias for /build",
    handler: runBuild,
  });
}
