-- CLI integration only. The stock AI extra reserves <leader>a and <Tab>,
-- which conflict with quick-save and Colemak window navigation here.
return {
  {
    "folke/sidekick.nvim",
    opts = {
      nes = { enabled = false },
      cli = {
        win = {
          keys = {
            nav_down = { "<c-n>", "nav_down", expr = true, desc = "Go to lower window" },
            nav_up = { "<c-e>", "nav_up", expr = true, desc = "Go to upper window" },
            nav_right = { "<c-i>", "nav_right", expr = true, desc = "Go to right window" },
          },
        },
      },
    },
    keys = {
      {
        "<leader>Ac",
        function()
          require("sidekick.cli").toggle({ name = "codex", focus = true })
        end,
        desc = "Codex CLI",
      },
      {
        "<leader>Ai",
        function()
          require("sidekick.cli").toggle({ name = "pi", focus = true })
        end,
        desc = "Pi CLI",
      },
      {
        "<leader>Ao",
        function()
          require("sidekick.cli").toggle({ name = "opencode", focus = true })
        end,
        desc = "OpenCode CLI",
      },
      {
        "<leader>As",
        function()
          require("sidekick.cli").select({ filter = { installed = true } })
        end,
        desc = "Select AI CLI",
      },
      {
        "<leader>Ad",
        function()
          require("sidekick.cli").close()
        end,
        desc = "Close AI CLI",
      },
      {
        "<leader>Af",
        function()
          require("sidekick.cli").send({ msg = "{file}" })
        end,
        desc = "Send File to AI CLI",
      },
      {
        "<leader>Av",
        function()
          require("sidekick.cli").send({ msg = "{selection}" })
        end,
        mode = "x",
        desc = "Send Selection to AI CLI",
      },
      {
        "<leader>Ap",
        function()
          require("sidekick.cli").prompt()
        end,
        mode = { "n", "x" },
        desc = "AI CLI Prompt",
      },
    },
  },
  {
    "folke/which-key.nvim",
    opts = { spec = { { "<leader>A", group = "AI CLI", mode = { "n", "x" } } } },
  },
}
