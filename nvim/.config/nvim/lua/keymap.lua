-- 2 typet of options
local map = vim.api.nvim_set_keymap
local opts = {noremap = true, silent = true}
local opts_ns = {noremap = true}

-- Colemak Keybindings {{{
   ----------------------
   map('n', 'n', 'j', opts)
   map('x', 'n', 'j', opts)
   map('o', 'n', 'j', opts)
   map('n', 'e', 'k', opts)
   map('x', 'e', 'k', opts)
   map('o', 'e', 'k', opts)
   map('n', 'i', 'l', opts)
   map('x', 'i', 'l', opts)
   map('o', 'i', 'l', opts)

  -- Colemak Insert
   map('n', 'u', 'i', opts)
   map('n', 'U', 'I', opts)
   map('x', 'u', 'i', opts)
   map('x', 'U', 'I', opts)
   map('o', 'u', 'i', opts)
   map('o', 'U', 'I', opts)

   -- Colemak Search Matching
   map('n', 'k', 'n', opts)
   map('n', 'K', 'N', opts)

   -- Command mode without Shift
   map('n', ';', ':', opts_ns)
   map('n', ':', ';', opts_ns)

   -- Undo/redo
   map('n', 'l', 'u', opts)
   map('x', 'l', ':<C-U>undo<CR>', opts)
   map('n', 'gl', 'u', opts)
   map('x', 'gl', ':<C-U>undo<CR>', opts)

   -- Colemak Windows
   map('n', '<C-W>h', '<C-W>h', opts)
   map('x', '<C-W>h', '<C-W>h', opts)
   map('n', '<C-W>n', '<C-W>j', opts)
   map('x', '<C-W>n', '<C-W>j', opts)
   map('n', '<C-W>e', '<C-W>k', opts)
   map('x', '<C-W>e', '<C-W>k', opts)
   map('n', '<C-W>i', '<C-W>k', opts)
   map('x', '<C-W>i', '<C-W>k', opts)

   -- window & tab controls
   map('n', '<leader>ss', ':sp<space>', opts)
   map('n', '<leader>vs', ':vsp<space>', opts)
   -- tab controls -- ctrl-t makes a new tab
   map('n', '<C-t>', '<Esc>:tabnew<CR>', opts) -- Check collision!
   -- shift T turn a split window into a tab
   map('n', '<S-T>', '<Esc><C-w>T', opts) -- Check collision!
   map('n', 'te', ':tabnext<CR>', opts)
   map('n', 'tn', ':tabprev<CR>', opts)
   map('n', 'th', ':tabfirst<CR>', opts)
   map('n', 'ti', ':tablast<CR>', opts)

-- }}}

-- {{{ Improvments
   map('n', '<leader><space>', ':set hlsearch!<CR>', opts)
   map('n', '<leader>sl', ':set wrap linebreak<CR>', opts)

   -- highlight last inserted text
   map('n', 'gV', '`[v]`', opts)

   -- leader-o/O inserts blank line below/above
    map('n', '<leader>o', 'o<ESC>', opts)
    map('n', '<leader>O', 'O<ESC>', opts)
    
    -- Move line up and down in NORMAL and VISUAL modes
    -- Reference: https://vim.fandom.com/wiki/Moving_lines_up_or_down
    map('n', '<A-n>', '<CMD>move .+1<CR>', opts)
    map('n', '<A-e>', '<CMD>move .-2<CR>', opts)
    map('x', '<A-n>', ":move '>+1<CR>gv=gv", opts)
    map('x', '<A-e>', ":move '<-2<CR>gv=gv", opts)
-- }}}
