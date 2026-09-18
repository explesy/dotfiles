/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo, Show } from "solid-js"

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

const compact = (value: string) => value.replace(/\s+/g, " ").trim()

const clip = (value: string, limit: number) => {
  const text = compact(value)
  if (text.length <= limit) return text

  const head = text.slice(0, limit - 1)
  const boundary = head.lastIndexOf(" ")
  return `${head.slice(0, boundary > limit * 0.6 ? boundary : head.length).trimEnd()}…`
}

const visibleText = (api: TuiPluginApi, messageID: string) =>
  (api.state.part(messageID) as readonly any[])
    .filter((part) => part?.type === "text" && !part.synthetic && !part.ignored && typeof part.text === "string")
    .map((part) => part.text)
    .join(" ")

const taskFromText = (value: string) => {
  const text = compact(value)
  if (!text) return undefined

  const commandTask = text.match(/^\/(?:lp|luna|design|v)\s+(.+)$/i)
  if (commandTask?.[1]) return clip(commandTask[1], 180)

  if (/^\/(?:c|do|pr|review|hard|commit|simplify|ldo|workflow|wf)\s*$/i.test(text)) return undefined
  if (/^(?:да|ага|ок(?:ей)?|продолжай|continue|go on|yes|yep|sure)[.!…\s]*$/i.test(text)) return undefined

  return clip(text, 180)
}

const taskLabel = (api: TuiPluginApi, sessionID: string) => {
  const messages = api.state.session.messages(sessionID) as readonly any[]

  for (const message of [...(messages ?? [])].reverse()) {
    if (message?.role !== "user") continue

    const task = taskFromText(visibleText(api, message.id))
    if (task) return task

    const title = typeof message?.summary?.title === "string" ? compact(message.summary.title) : ""
    if (title) return clip(title, 180)
  }

  return undefined
}

const toolActivity = (part: any) => {
  const state = part?.state
  if (state?.status !== "running") return undefined

  if (typeof state.title === "string" && compact(state.title)) return clip(state.title, 120)

  const input = (state.input ?? {}) as Record<string, unknown>
  const target = [input.filePath, input.path, input.file, input.filename].find((value) => typeof value === "string")
  const detail = target ?? input.pattern ?? input.query ?? input.command
  const tool = titleCase(String(part.tool ?? "working"))

  return typeof detail === "string" && compact(detail)
    ? clip(`${tool} ${detail}`, 120)
    : tool
}

const currentActivity = (api: TuiPluginApi, sessionID: string) => {
  const messages = api.state.session.messages(sessionID) as readonly any[]

  for (const message of [...(messages ?? [])].reverse()) {
    if (message?.role !== "assistant") continue

    for (const part of [...(api.state.part(message.id) as readonly any[])].reverse()) {
      const activity = toolActivity(part)
      if (activity) return activity
    }
  }

  const status = api.state.session.status(sessionID) as any
  if (status?.type === "retry") return clip(`Retry ${status.attempt}: ${status.message ?? "waiting"}`, 120)

  if (status?.type === "busy") {
    for (const message of [...(messages ?? [])].reverse()) {
      if (message?.role !== "assistant") continue

      for (const part of [...(api.state.part(message.id) as readonly any[])].reverse()) {
        if ((part?.type === "reasoning" || part?.type === "text") && typeof part.text === "string" && compact(part.text)) {
          return clip(part.text, 120)
        }
      }
    }

    return "Thinking…"
  }

  return "Idle"
}

function FocusView(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current
  const task = createMemo(() => taskLabel(props.api, props.session_id))
  const activity = createMemo(() => currentActivity(props.api, props.session_id))

  return (
    <Show when={task() || activity()}>
      <box>
        <text fg={theme().text}>
          <b>Focus</b>
        </text>
        <Show when={task()}>
          <text fg={theme().textMuted}>
            Task <span style={{ fg: theme().text }}>{task()}</span>
          </text>
        </Show>
        <Show when={activity()}>
          <text fg={theme().textMuted}>
            Now  <span style={{ fg: theme().primary }}>{activity()}</span>
          </text>
        </Show>
      </box>
    </Show>
  )
}

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

  // Todo is already rendered by OpenCode's built-in sidebar plugin; Focus intentionally does not duplicate it.
  api.slots.register({
    order: 50,
    slots: {
      sidebar_content(_ctx, value) {
        return <FocusView api={api} session_id={value.session_id} />
      },
    },
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
