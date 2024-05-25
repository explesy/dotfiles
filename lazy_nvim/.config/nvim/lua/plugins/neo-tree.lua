return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = function(_, opts)
    opts.window = {
      mappings = {
        ["n"] = "next_node",   -- move down
        ["e"] = "prev_node",   -- move up
        ["h"] = "parent_node", -- optional: move to parent
        ["l"] = "open_node",   -- optional: open node
        -- Add other Colemak-specific mappings here if needed
      }
    }
    return opts
  end
}
