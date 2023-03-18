local g = vim.g
local o = vim.o

o.mouse='a'                     -- enable mouse
o.encoding='utf-8'
o.number=true                   -- line numbers
o.relativenumber=true           -- Show relative line numbers
o.noswapfile=true               -- prevent creation of swap
o.nocompatible=true             -- compatible mode off 
o.tabstop=2                     -- number of columns occpied by a tab
o.softtabstop=2
o.shiftwidth=2                  -- width for autoindent
o.expandtab=true                -- converts tabs to whitespaces
o.autoindent=true               -- indent a new line the same amount as the line just typed 
o.fileformat=unix 
o.clipboard='unnamedplus'       -- using system clipboard
o.ttyfast=true                  -- speed up scrolling
o.termguicolors = true          -- set term gui colors (most terminals support this)
o.ignorecase = true             -- ignore case in search patterns
o.showtabline = 2               -- always show tabs
o.smartindent = true            -- make indenting smarter again
o.updatetime = 300              -- faster completion (4000ms default)
o.signcolumn = "number"         -- always show the sign column, otherwise it would shift the text each time
o.scrolloff = 8                 -- lines after and before when scrolling 
o.sidescrolloff = 8
o.guifont = "monospace:h17"     -- the font used in graphical neovim applications
--o.cmdheight = 2                 -- more space in the neovim command line for displaying messages
--o.showmode = false              -- we don't need to see things like -- INSERT -- anymore

-- Map <leader> to space
g.mapleader = ' '
g.maplocalleader = ' '
