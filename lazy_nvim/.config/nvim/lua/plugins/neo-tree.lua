return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = {
    window = {
      mappings = {
        ["n"] = "next_sibling", -- перемещение вниз по узлам
        ["e"] = "previous_sibling", -- перемещение вверх по узлам
        ["h"] = "navigate_up", -- подняться на уровень выше
        ["i"] = "open", -- открыть узел
        ["y"] = "close_node",
      },
    },
  },
}
