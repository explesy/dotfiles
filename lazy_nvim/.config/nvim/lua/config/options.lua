-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here

local opt = vim.opt

-- Disable remote providers we don't use. Missing host packages make provider
-- detection and :checkhealth slow and occasionally feel like a freeze.
vim.g.loaded_node_provider = 0
vim.g.loaded_perl_provider = 0
vim.g.loaded_python3_provider = 0
vim.g.loaded_ruby_provider = 0
vim.g.snacks_animate = false

opt.scrolloff = 8 -- minimal number of screen lines to keep above and below the cursor.
opt.sidescrolloff = 8 -- minimal number of screen lines to keep left and right of the cursor.
opt.spell = false
opt.spelllang = { "en", "ru" }
opt.swapfile = false
opt.directory = "/tmp"
opt.timeoutlen = 200
opt.updatetime = 200
