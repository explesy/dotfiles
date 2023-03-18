return {
  -- add gruvbox
  { "sainnhe/gruvbox-material" },

  -- Configure LazyVim to load gruvbox
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = 'gruvbox-material',
      gruvbox_material_background = 'hard',
    },
  }
}
