return {
  {
    "sainnhe/gruvbox-material",
    lazy = false,
    priority = 1000,
    config = function()
      vim.g.gruvbox_material_background = "hard"
    end,
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    enabled = false,
  },
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "gruvbox-material",
      -- colorscheme = "tokyonight-night",
    },
  },
}
