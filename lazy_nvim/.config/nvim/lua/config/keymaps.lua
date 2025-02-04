-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Colemak navigation
vim.keymap.set(
  { "n", "x" },
  "n",
  "v:count == 0 ? 'gj' : 'j'",
  { expr = true, silent = true, desc = "Move down (Colemak)" }
)
vim.keymap.set(
  { "n", "x" },
  "e",
  "v:count == 0 ? 'gk' : 'k'",
  { expr = true, silent = true, desc = "Move up (Colemak)" }
)
vim.keymap.set({ "n", "x" }, "i", "l", { remap = false, silent = true, desc = "Move right (Colemak)" })

-- Edit mode
vim.keymap.set({ "n" }, "t", "i", { remap = false, silent = true, desc = "Enter insert mode" })
vim.keymap.set({ "n" }, "T", "I", { remap = false, silent = true, desc = "Enter insert mode at beginning of line" })

-- Redo
vim.keymap.set("n", "U", "<C-r>", { noremap = true, silent = true, desc = "Redo" })

-- Move by paragraphs
vim.keymap.set("n", "E", "{", { noremap = true, silent = true, desc = "Move up a paragraph" })
vim.keymap.set("n", "N", "}", { noremap = true, silent = true, desc = "Move down a paragraph" })

-- Window navigation
vim.keymap.set("n", "<C-h>", "<C-w>h", { desc = "Go to left window", remap = true })
vim.keymap.set("n", "<C-n>", "<C-w>j", { desc = "Go to lower window", remap = true })
vim.keymap.set("n", "<C-e>", "<C-w>k", { desc = "Go to upper window", remap = true })
vim.keymap.set("n", "<C-i>", "<C-w>l", { desc = "Go to right window", remap = true })

-- Move Lines
vim.keymap.set("n", "<A-n>", "<cmd>m .+1<cr>==", { desc = "Move line down" })
vim.keymap.set("n", "<A-e>", "<cmd>m .-2<cr>==", { desc = "Move line up" })
vim.keymap.set("i", "<A-n>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move line down" })
vim.keymap.set("i", "<A-e>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move line up" })
vim.keymap.set("v", "<A-n>", ":m '>+1<cr>gv=gv", { desc = "Move selection down" })
vim.keymap.set("v", "<A-e>", ":m '<-2<cr>gv=gv", { desc = "Move selection up" })

-- Buffer navigation
vim.keymap.set("n", "<S-h>", "<cmd>bprevious<cr>", { desc = "Previous buffer" })
vim.keymap.set("n", "<S-i>", "<cmd>bnext<cr>", { desc = "Next buffer" })

-- Search navigation
vim.keymap.set("n", "k", "'Nn'[v:searchforward].'zv'", { expr = true, desc = "Next search result" })
vim.keymap.set("x", "k", "'Nn'[v:searchforward]", { expr = true, desc = "Next search result" })
vim.keymap.set("o", "k", "'Nn'[v:searchforward]", { expr = true, desc = "Next search result" })
vim.keymap.set("n", "K", "'nN'[v:searchforward].'zv'", { expr = true, desc = "Previous search result" })
vim.keymap.set("x", "K", "'nN'[v:searchforward]", { expr = true, desc = "Previous search result" })
vim.keymap.set("o", "K", "'nN'[v:searchforward]", { expr = true, desc = "Previous search result" })

-- Terminal Mappings
vim.keymap.set("t", "<esc><esc>", "<c-\\><c-n>", { desc = "Enter Normal Mode" })
vim.keymap.set("t", "<C-h>", "<cmd>wincmd h<cr>", { desc = "Go to left window" })
vim.keymap.set("t", "<C-n>", "<cmd>wincmd j<cr>", { desc = "Go to lower window" })
vim.keymap.set("t", "<C-e>", "<cmd>wincmd k<cr>", { desc = "Go to upper window" })
vim.keymap.set("t", "<C-i>", "<cmd>wincmd l<cr>", { desc = "Go to right window" })
vim.keymap.set("t", "<C-/>", "<cmd>close<cr>", { desc = "Hide Terminal" })

-- Quick save
vim.keymap.set("n", "<leader>a", ":w<CR>", { noremap = true, silent = true, desc = "Quick save" })
