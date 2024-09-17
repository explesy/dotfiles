return {
  {
    "sainnhe/gruvbox-material",
    config = function()
      vim.g.gruvbox_material_background = 'hard'
    end
  },
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
  },
  { "ellisonleao/gruvbox.nvim" },
  { "sainnhe/edge" },
  { "sainnhe/sonokai" },
  {
    "rebelot/kanagawa.nvim",
    opts = {
      theme = "dragon",
      background = {     -- map the value of 'background' option to a theme
        dark = "dragon", -- try "dragon" because "wave" is default !
        light = "lotus"
      }
    }
  }, {
  "LazyVim/LazyVim",
  opts = {
    -- colorscheme = "gruvbox-material"
    colorscheme = "tokyonight-night"
  }
} }
