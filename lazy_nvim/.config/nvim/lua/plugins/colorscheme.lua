return {
  {
    "sainnhe/gruvbox-material",
    config = function()
      vim.g.gruvbox_material_background = "hard"
    end,
  },
  { "ellisonleao/gruvbox.nvim" },
  { "sainnhe/edge" },
  { "sainnhe/sonokai" },
  {
    "rebelot/kanagawa.nvim",
    opts = {
      theme = "dragon",
      background = { -- map the value of 'background' option to a theme
        dark = "dragon", -- try "dragon" because "wave" is default !
        light = "lotus",
      },
    },
  },
  {
    "eldritch-theme/eldritch.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
  },
  {
    "LazyVim/LazyVim",
    opts = {
      -- colorscheme = "gruvbox-material",
      colorscheme = "catppuccin-macchiato",
      -- colorscheme = "tokyonight-night",
    },
  },
}
