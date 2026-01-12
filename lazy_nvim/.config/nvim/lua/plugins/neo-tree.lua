return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = {
    window = {
      mappings = {
        ["n"] = function()
          vim.cmd("normal! j")
        end, -- перемещение вниз по узлам
        ["e"] = function()
          vim.cmd("normal! k")
        end, -- перемещение вверх по узлам
        ["h"] = "navigate_up", -- подняться на уровень выше
        ["i"] = "open", -- открыть узел
        ["y"] = "close_node",
      },
    },
  },
}
