-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

local augroup = vim.api.nvim_create_augroup("UserAutocmds", { clear = true })

vim.api.nvim_create_autocmd("FileType", {
  group = augroup,
  pattern = { "markdown" },
  callback = function(event)
    vim.opt_local.spell = false
    if vim.diagnostic.disable then
      vim.diagnostic.disable(event.buf)
    else
      vim.diagnostic.enable(false, { bufnr = event.buf })
    end
  end,
})
