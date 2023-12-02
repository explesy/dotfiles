-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Colemak up/down/right with nei
vim.keymap.set({ "n", "x" }, "n", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
vim.keymap.set({ "n", "x" }, "e", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })
vim.keymap.set({ "n", "x" }, "i", "'l'", { expr = true, silent = true })

-- Edit mode with t and T
vim.keymap.set({ "n" }, "t", "'i'", { expr = true, silent = true })
vim.keymap.set({ "n" }, "T", "'I'", { expr = true, silent = true })

-- Redo with U
vim.keymap.set({ "n" }, "U", "<C-r>", { expr = true, silent = true })

-- Move to window using the <ctrl> hnei keys
vim.keymap.set("n", "<C-h>", "<C-w>h", { desc = "Go to left window", remap = true })
vim.keymap.set("n", "<C-n>", "<C-w>j", { desc = "Go to lower window", remap = true })
vim.keymap.set("n", "<C-e>", "<C-w>k", { desc = "Go to upper window", remap = true })
vim.keymap.set("n", "<C-i>", "<C-w>l", { desc = "Go to right window", remap = true })

-- Move Lines up and down with Alt-n, Alt-e
vim.keymap.set("n", "<A-n>", "<cmd>m .+1<cr>==", { desc = "Move down" })
vim.keymap.set("n", "<A-e>", "<cmd>m .-2<cr>==", { desc = "Move up" })
vim.keymap.set("i", "<A-n>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move down" })
vim.keymap.set("i", "<A-e>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move up" })
vim.keymap.set("v", "<A-n>", ":m '>+1<cr>gv=gv", { desc = "Move down" })
vim.keymap.set("v", "<A-e>", ":m '<-2<cr>gv=gv", { desc = "Move up" })

-- Switch buffers with Shift-h and Shift-i
vim.keymap.set("n", "<S-h>", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
vim.keymap.set("n", "<S-i>", "<cmd>bnext<cr>", { desc = "Next buffer" })


-- Sane search with k and K
-- https://github.com/mhinz/vim-galore#saner-behavior-of-n-and-n
vim.keymap.set("n", "k", "'Nn'[v:searchforward].'zv'", { expr = true, desc = "Next search result" })
vim.keymap.set("x", "k", "'Nn'[v:searchforward]", { expr = true, desc = "Next search result" })
vim.keymap.set("o", "k", "'Nn'[v:searchforward]", { expr = true, desc = "Next search result" })
vim.keymap.set("n", "K", "'nN'[v:searchforward].'zv'", { expr = true, desc = "Prev search result" })
vim.keymap.set("x", "K", "'nN'[v:searchforward]", { expr = true, desc = "Prev search result" })
vim.keymap.set("o", "K", "'nN'[v:searchforward]", { expr = true, desc = "Prev search result" })

-- Terminal Mappings
vim.keymap.set("t", "<esc><esc>", "<c-\\><c-n>", { desc = "Enter Normal Mode" })
vim.keymap.set("t", "<C-h>", "<cmd>wincmd h<cr>", { desc = "Go to left window" })
vim.keymap.set("t", "<C-n>", "<cmd>wincmd j<cr>", { desc = "Go to lower window" })
vim.keymap.set("t", "<C-e>", "<cmd>wincmd k<cr>", { desc = "Go to upper window" })
vim.keymap.set("t", "<C-i>", "<cmd>wincmd l<cr>", { desc = "Go to right window" })
vim.keymap.set("t", "<C-/>", "<cmd>close<cr>", { desc = "Hide Terminal" })
vim.keymap.set("t", "<c-_>", "<cmd>close<cr>", { desc = "which_key_ignore" })
