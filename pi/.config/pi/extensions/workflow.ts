import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4.1-flash";
const HERDSMAN_COORDINATION_TOOLS = new Set(["agent", "chief", "staff"]);

export default function workflowCommands(pi: ExtensionAPI) {
  const runBuild = async (args: string, ctx: ExtensionCommandContext) => {
    if (
      pi.getActiveTools().some((tool) => HERDSMAN_COORDINATION_TOOLS.has(tool))
    ) {
      ctx.ui.notify(
        "Restart with the configured pi launcher; /build is unavailable while Herdsman tools are loaded.",
        "error",
      );
      return;
    }

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
      pi.sendUserMessage(task);
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
