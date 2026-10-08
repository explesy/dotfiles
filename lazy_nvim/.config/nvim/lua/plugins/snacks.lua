return {
  {
    "folke/snacks.nvim",
    opts = {
      quickfile = {
        exclude = { "latex", "markdown", "markdown_inline" },
      },
      picker = {
        win = {
          -- Normal mode uses the same Colemak motions as editing buffers.
          -- Insert mode retains n/e/i as query text.
          input = { keys = { n = { "list_down", mode = "n" }, e = { "list_up", mode = "n" } } },
          list = { keys = { n = "list_down", e = "list_up", i = "focus_preview", t = "focus_input" } },
          preview = { keys = { t = "focus_input" } },
        },
      },
      indent = {
        enabled = false,
      },
    },
  },
}
