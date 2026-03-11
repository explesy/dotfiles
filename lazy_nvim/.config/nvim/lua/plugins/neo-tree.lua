return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = {
    close_if_last_window = true,
    popup_border_style = "rounded",
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
    filesystem = {
      follow_current_file = {
        enabled = true,
      },
      hijack_netrw_behavior = "open_default",
      -- Safer default for large repos/network mounts: avoid background watcher load.
      use_libuv_file_watcher = false,
    },
  },
}
