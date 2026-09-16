// Enforce the intended model for each primary mode on every user turn.
// This is a workaround for OpenCode Desktop builds where the model picker can
// retain a stale/manual model when switching primary agents.

const ROUTES = {
  build: { providerID: "opencode-go", modelID: "deepseek-v4-flash" },
  "build-v41": { providerID: "opencode-go", modelID: "deepseek-v4.1-flash" },
  plan: { providerID: "opencode-go", modelID: "gpt-5.6-luna", variant: "high" },
  quality: { providerID: "opencode-go", modelID: "gpt-5.6-luna", variant: "high" },
  "free-build": { providerID: "opencode", modelID: "nemotron-3.5-lightning-free" },
  design: { providerID: "opencode-go", modelID: "glm-5.3-flash", variant: "high" },
  vision: { providerID: "opencode-go", modelID: "qwen3.8-flash" },
}

export const ModeModelRouter = async () => {
  return {
    "chat.message": async (input, output) => {
      const route = ROUTES[input.agent]
      if (!route || !output?.message) return

      output.message.model = {
        providerID: route.providerID,
        modelID: route.modelID,
        ...(route.variant ? { variant: route.variant } : {}),
      }
    },
  }
}
