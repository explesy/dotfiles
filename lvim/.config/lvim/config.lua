-- vim options
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.relativenumber = true

-- general
lvim.log.level = "info"
lvim.format_on_save = {
  enabled = true,
  pattern = "*.lua",
  timeout = 1000,
}
-- to disable icons and use a minimalist setup, uncomment the following
-- lvim.use_icons = false

-- keymappings <https://www.lunarvim.org/docs/configuration/keybindings>
lvim.leader = "space"
lvim.keys.normal_mode["<C-s>"] = ":w<cr>"

-- Colemak keys
-- Movement
lvim.keys.normal_mode['n'] = 'j'
lvim.keys.normal_mode['e'] = 'k'
lvim.keys.normal_mode['i'] = 'l'

lvim.keys.visual_mode['n'] = 'j'
lvim.keys.visual_mode['e'] = 'k'
lvim.keys.visual_mode['i'] = 'l'

-- Insert mode
lvim.keys.normal_mode['t'] = 'i'
lvim.keys.normal_mode['T'] = 'I'
-- Next search
lvim.keys.normal_mode['k'] = 'n'
lvim.keys.normal_mode['K'] = 'N'
lvim.keys.normal_mode[':'] = ';'
lvim.keys.normal_mode[';'] = ':'
-- Undo
lvim.keys.normal_mode['U'] = '<C-r>'

-- Windows moving
lvim.keys.normal_mode["<C-n>"] = "<C-W>j"
lvim.keys.normal_mode["<C-e>"] = "<C-W>k"
lvim.keys.normal_mode["<C-i>"] = "<C-W>l"

-- Move line up and down in NORMAL and VISUAL modes
-- Reference: https://vim.fandom.com/wiki/Moving_lines_up_or_down
lvim.keys.normal_mode['<A-n>'] = '<CMD>move .+1<CR>'
lvim.keys.normal_mode['<A-e>'] = '<CMD>move .-2<CR>'
lvim.keys.visual_mode['<A-n>'] = ":move '>+1<CR>gv=gv'"
lvim.keys.visual_mode['<A-e>'] = ":move '>-2<CR>gv=gv'"

-- Moving throudh buffers left and right
lvim.keys.normal_mode["<S-i>"] = ":BufferLineCycleNext<CR>"
lvim.keys.normal_mode["<S-h>"] = ":BufferLineCyclePrev<CR>"

-- -- Use which-key to add extra bindings with the leader-key prefix
-- lvim.builtin.which_key.mappings["W"] = { "<cmd>noautocmd w<cr>", "Save without formatting" }
-- lvim.builtin.which_key.mappings["P"] = { "<cmd>Telescope projects<CR>", "Projects" }

-- -- Change theme settings
lvim.colorscheme = 'gruvbox-material'
vim.g.gruvbox_material_background = 'hard'

-- After changing plugin config exit and reopen LunarVim, Run :PackerSync
lvim.builtin.alpha.active = true
lvim.builtin.alpha.mode = "dashboard"
lvim.builtin.terminal.active = true
lvim.builtin.nvimtree.setup.view.side = "left"
lvim.builtin.nvimtree.setup.renderer.icons.show.git = false

-- Automatically install missing parsers when entering buffer
lvim.builtin.treesitter.auto_install = true

-- lvim.builtin.treesitter.ignore_install = { "haskell" }

-- -- Additional Plugins <https://www.lunarvim.org/docs/plugins#user-plugins>
lvim.plugins = {
  {
    -- "folke/trouble.nvim",
    -- cmd = "TroubleToggle",
    'sainnhe/gruvbox-material'
  },
}

-- -- Autocommands (`:help autocmd`) <https://neovim.io/doc/user/autocmd.html>
vim.api.nvim_create_autocmd("FileType", {
  pattern = "zsh",
  callback = function()
    -- let treesitter use bash highlight for zsh files as well
    require("nvim-treesitter.highlight").attach(0, "bash")
  end,
})
