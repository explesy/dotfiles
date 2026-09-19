import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const BUILD_PROVIDER = "opencode-go";
const BUILD_MODEL = "deepseek-v4-flash";

export default function workflowCommands(pi: ExtensionAPI) {
  const runBuild = async (
    args: string,
    ctx: Parameters<Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]>[1],
  ) => {
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

    ctx.ui.notify(
      `Build model: ${BUILD_PROVIDER}/${BUILD_MODEL}`,
      "info",
    );
  };

  pi.registerCommand("build", {
    description: "Switch to DeepSeek V4 Flash build model and optionally run a task",
    handler: runBuild,
  });

  pi.registerCommand("b", {
    description: "Alias for /build",
    handler: runBuild,
  });
}
