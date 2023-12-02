return {
  {
    "sainnhe/gruvbox-material",
    config = function()
      vim.g.gruvbox_material_background = 'hard'
    end
  },
  -- {
  --   "eddyekofo94/gruvbox-flat.nvim",
  --   config = function()
  --     vim.g.gruvbox_flat_style = 'dark'
  --   end
  -- },
  { "ellisonleao/gruvbox.nvim" },
  -- { "sainnhe/everforest" },
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
    colorscheme = "gruvbox-material"
  }
} }
