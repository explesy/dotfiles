-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

local map = vim.keymap.set

local function map_key(mode, lhs, rhs, desc, opts)
  local options = { desc = desc, silent = true }
  if opts then
    options = vim.tbl_extend("force", options, opts)
  end
  map(mode, lhs, rhs, options)
end

-- Colemak navigation
map_key({ "n", "x" }, "n", "v:count == 0 ? 'gj' : 'j'", "Move down (Colemak)", { expr = true })
map_key({ "n", "x" }, "e", "v:count == 0 ? 'gk' : 'k'", "Move up (Colemak)", { expr = true })
map_key({ "n", "x" }, "i", "l", "Move right (Colemak)", { remap = false })

-- Edit mode
map_key("n", "t", "i", "Enter insert mode", { remap = false })
map_key("n", "T", "I", "Enter insert mode at beginning of line", { remap = false })

-- Exit insert mode with double 'nn'
map_key("i", "nn", "<Esc>", "Exit insert mode with double nn")

-- Redo
map_key("n", "U", "<C-r>", "Redo")

-- Move by paragraphs
map_key("n", "E", "{", "Move up a paragraph")
map_key("n", "N", "}", "Move down a paragraph")

-- Window navigation
map_key("n", "<C-h>", "<C-w>h", "Go to left window", { remap = true })
map_key("n", "<C-n>", "<C-w>j", "Go to lower window", { remap = true })
map_key("n", "<C-e>", "<C-w>k", "Go to upper window", { remap = true })
map_key("n", "<C-i>", "<C-w>l", "Go to right window", { remap = true })

-- Move Lines
map_key("n", "<A-n>", "<cmd>m .+1<cr>==", "Move line down")
map_key("n", "<A-e>", "<cmd>m .-2<cr>==", "Move line up")
map_key("i", "<A-n>", "<esc><cmd>m .+1<cr>==gi", "Move line down")
map_key("i", "<A-e>", "<esc><cmd>m .-2<cr>==gi", "Move line up")
map_key("v", "<A-n>", ":m '>+1<cr>gv=gv", "Move selection down")
map_key("v", "<A-e>", ":m '<-2<cr>gv=gv", "Move selection up")

-- Buffer navigation
map_key("n", "<S-h>", "<cmd>bprevious<cr>", "Previous buffer")
map_key("n", "<S-i>", "<cmd>bnext<cr>", "Next buffer")

-- Search navigation
map_key("n", "k", "'Nn'[v:searchforward].'zv'", "Next search result", { expr = true })
map_key("x", "k", "'Nn'[v:searchforward]", "Next search result", { expr = true })
map_key("o", "k", "'Nn'[v:searchforward]", "Next search result", { expr = true })
map_key("n", "K", "'nN'[v:searchforward].'zv'", "Previous search result", { expr = true })
map_key("x", "K", "'nN'[v:searchforward]", "Previous search result", { expr = true })
map_key("o", "K", "'nN'[v:searchforward]", "Previous search result", { expr = true })

-- Terminal Mappings
map_key("t", "<esc><esc>", "<c-\\><c-n>", "Enter Normal Mode")
map_key("t", "<C-h>", "<cmd>wincmd h<cr>", "Go to left window")
map_key("t", "<C-n>", "<cmd>wincmd j<cr>", "Go to lower window")
map_key("t", "<C-e>", "<cmd>wincmd k<cr>", "Go to upper window")
map_key("t", "<C-i>", "<cmd>wincmd l<cr>", "Go to right window")
map_key("t", "<C-/>", "<cmd>close<cr>", "Hide Terminal")

-- Quick save
map_key("n", "<leader>a", ":w<CR>", "Quick save")
