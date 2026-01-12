-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

local augroup = vim.api.nvim_create_augroup("UserAutocmds", { clear = true })

vim.api.nvim_create_autocmd("FileType", {
  group = augroup,
  pattern = { "markdown" },
  callback = function(event)
    vim.opt_local.spell = false
    vim.diagnostic.disable(event.buf)
  end,
})
