local g = vim.g
local o = vim.o

o.mouse='a'                -- enable mouse
o.encoding='utf-8'
o.number=true                 -- line numbers
o.relativenumber=true         -- Show relative line numbers
o.noswapfile=true    -- prevent creation of swap
o.nocompatible=true        -- compatible mode off 
o.tabstop=4              -- number of columns occpied by a tab
o.softtabstop=4
o.shiftwidth=4           -- width for autoindent
o.expandtab=true      -- converts tabs to whitespaces
o.autoindent=true         -- indent a new line the same amount as the line just typed 
o.fileformat=unix 
o.clipboard='unnamedplus'  --usting system clipboard
o.ttyfast=true                -- speed up scrolling


-- Map <leader> to space
g.mapleader = ' '
g.maplocalleader = ' '
