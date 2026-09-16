/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"

const WORKFLOW = [
  {
    title: "/lp — Plan",
    value: "lp",
    description: "Luna High · read-only implementation plan",
  },
  {
    title: "/pr — Plan review",
    value: "pr",
    description: "Terra High · independent pre-implementation review",
  },
  {
    title: "/do — Build",
    value: "do",
    description: "DeepSeek V4 Flash · normal implementation after plan review",
  },
  {
    title: "/ldo — Hard build",
    value: "ldo",
    description: "Luna High · risky or unusually complex implementation",
  },
  {
    title: "/luna — Quality escalation",
    value: "luna",
    description: "Luna High · hard debugging, architecture, cross-cutting work",
  },
  {
    title: "/review — Code review",
    value: "review",
    description: "MiMo-V2.5 Free · independent post-implementation review",
  },
  {
    title: "/hard — Hard review",
    value: "hard",
    description: "Terra High · manual escalation review",
  },
  {
    title: "/design — UI / design",
    value: "design",
    description: "GLM-5.3 Flash High · screenshot/reference-driven frontend work",
  },
  {
    title: "/v — Vision",
    value: "v",
    description: "Qwen3.8 Flash · economical screenshot/image diagnosis",
  },
  {
    title: "/c — Continue",
    value: "c",
    description: "Continue from the exact current state without redoing finished analysis",
  },
  {
    title: "/simplify — Simplify",
    value: "simplify",
    description: "Inspect recent changes for unnecessary complexity",
  },
  {
    title: "/commit — Commit",
    value: "commit",
    description: "Stage relevant files and create a local conventional commit; never push",
  },
]

const AGENTS: Record<string, string> = {
  build: "BUILD",
  "build-v41": "BUILD 4.1",
  plan: "PLAN",
  quality: "QUALITY",
  "free-build": "FREE",
  design: "DESIGN",
  vision: "VISION",
}

const MODELS: Record<string, string> = {
  "deepseek-v4-flash": "DeepSeek V4 Flash",
  "deepseek-v4.1-flash": "DeepSeek V4.1 Flash",
  "nemotron-3.5-lightning-free": "Nemotron 3.5 Lightning Free",
  "gpt-5.6-luna": "Luna",
  "gpt-5.6-terra": "Terra",
  "glm-5.3-flash": "GLM-5.3 Flash",
  "qwen3.8-flash": "Qwen3.8 Flash",
  "mimo-v2.5": "MiMo-V2.5",
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const routeLabel = (api: TuiPluginApi, sessionID: string) => {
  const session = api.state.session.get(sessionID) as any
  const messages = api.state.session.messages(sessionID) as readonly any[]
  const latestUser = [...(messages ?? [])].reverse().find((message) => message?.role === "user")

  const agent = session?.agent ?? latestUser?.agent ?? "build"
  const sessionModel = session?.model
  const model = sessionModel
    ? {
        providerID: sessionModel.providerID,
        modelID: sessionModel.modelID ?? sessionModel.id,
        variant: sessionModel.variant,
      }
    : latestUser?.model

  const agentName = AGENTS[agent] ?? String(agent).toUpperCase()
  if (!model?.modelID) return agentName

  const modelName = MODELS[model.modelID] ?? model.modelID
  const variant = typeof model.variant === "string" && model.variant ? ` ${titleCase(model.variant)}` : ""
  return `${agentName} · ${modelName}${variant}`
}

const openWorkflow = (api: TuiPluginApi) => {
  const DialogSelect = api.ui.DialogSelect
  api.ui.dialog.setSize("large")
  api.ui.dialog.replace(() => (
    <DialogSelect
      title="AC workflow commands"
      placeholder="Search workflow…"
      options={WORKFLOW}
      onSelect={(item) => {
        api.ui.dialog.clear()
        api.ui.toast({
          variant: "info",
          title: item.title,
          message: `Type /${item.value}${["lp", "luna", "design", "v"].includes(item.value) ? " <task>" : ""}`,
          duration: 3000,
        })
      }}
    />
  ))
}

const tui: TuiPlugin = async (api) => {
  api.keymap.registerLayer({
    mode: "base",
    commands: [
      {
        name: "ac.workflow.help",
        title: "AC workflow commands",
        desc: "Show the plan → review → build command cheat sheet",
        category: "Workflow",
        namespace: "palette",
        slashName: "workflow",
        slashAliases: ["wf"],
        suggested: true,
        run() {
          openWorkflow(api)
        },
      },
    ],
  })

  api.slots.register({
    slots: {
      home_prompt_right(ctx) {
        const theme = ctx.theme.current
        return (
          <box onMouseUp={() => openWorkflow(api)} flexShrink={0}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.primary }}>/workflow</span> commands
            </text>
          </box>
        )
      },
      session_prompt_right(ctx, value) {
        const theme = ctx.theme.current
        return (
          <box onMouseUp={() => openWorkflow(api)} flexShrink={0}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.primary }}>{routeLabel(api, value.session_id)}</span> · /wf
            </text>
          </box>
        )
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "ac.workflow-ui",
  tui,
}

export default plugin
