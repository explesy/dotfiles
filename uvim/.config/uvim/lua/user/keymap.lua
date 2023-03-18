-- 2 types of options
local map = vim.api.nvim_set_keymap
local opts = {noremap = true, silent = true}
local opts_ns = {noremap = true}

    -- Colemak Keybindings 
    ----------------------
    map('n', 'n', 'j', opts)
    map('n', 'e', 'k', opts)
    map('n', 'i', 'l', opts)

    map('x', 'n', 'j', opts)
    map('x', 'e', 'k', opts)
    map('x', 'i', 'l', opts)

    map('o', 'n', 'j', opts)
    map('o', 'e', 'k', opts)
    map('o', 'i', 'l', opts)

    -- Colemak Page Up and Down
    map('n', '<C-n>', '<C-f>', opts)
    map('n', '<C-e>', '<C-b>', opts)
    
    -- Colemak Insert
    map('n', 't', 'i', opts)
    map('n', 'T', 'I', opts)
    map('x', 't', 'i', opts)
    map('x', 'T', 'I', opts)
    map('o', 't', 'i', opts)
    map('o', 'T', 'I', opts)

    -- Colemak Search Matching
    map('n', 'k', 'n', opts)
    map('n', 'K', 'N', opts)

    -- Command mode without Shift
    map('n', ';', ':', opts_ns)
    map('n', ':', ';', opts_ns)

    -- Undo/redo
    map('n', 'l', 'u', opts)
    map('n', 'U', '<C-r>', opts)

    -- Colemak Windows
    map('n', '<leader>ss', ':sp<CR>', opts)
    map('n', '<leader>vs', ':vsp<CR>', opts)
    map('n', '<C-w>h', '<C-W><Left>', opts)
    map('n', '<C-w>n', '<C-W><Down>', opts)
    map('n', '<C-w>e', '<C-W><Up>', opts)
    map('n', '<C-w>i', '<C-W><Right>', opts)

    -- Resize with arrows
    map("n", "<C-Up>", ":resize +2<CR>", opts)
    map("n", "<C-Down>", ":resize -2<CR>", opts)
    map("n", "<C-Left>", ":vertical resize -2<CR>", opts)
    map("n", "<C-Right>", ":vertical resize +2<CR>", opts)

    -- Navigate buffers
    map("n", "<S-i>", ":bnext<CR>", opts)
    map("n", "<S-h>", ":bprevious<CR>", opts)
    
    -- File navigator   
    map('n', '<leader>e', ':Lex 30<CR>', opts)

    -- Visual --
    -- Stay in indent mode
    map("v", "<", "<gv", opts)
    map("v", ">", ">gv", opts)
    
    -- Paste over selected text 
    map("v", "p", '"_dP', opts)

    -- Highlite and linebreak
    map('n', '<leader><space>', ':set hlsearch!<CR>', opts)
    map('n', '<leader>sl', ':set wrap linebreak<CR>', opts)

    -- leader-o/O inserts blank line below/above
    map('n', '<leader>o', 'o<ESC>', opts)
    map('n', '<leader>O', 'O<ESC>', opts)

    -- Move line up and down in NORMAL and VISUAL modes
    -- Reference: https://vim.fandom.com/wiki/Moving_lines_up_or_down
    map('n', '<A-n>', '<CMD>move .+1<CR>', opts)
    map('n', '<A-e>', '<CMD>move .-2<CR>', opts)
    map('x', '<A-n>', ":move '>+1<CR>gv=gv", opts)
    map('x', '<A-e>', ":move '<-2<CR>gv=gv", opts)
    
    -- Still don't know if and how below working

    -- Terminal --
    -- Better terminal navigation
    map("t", "<C-h>", "<C-\\><C-N><C-w>h", opts_ns)
    map("t", "<C-n>", "<C-\\><C-N><C-w>j", opts_ns)
    map("t", "<C-e>", "<C-\\><C-N><C-w>k", opts_ns)
    map("t", "<C-i>", "<C-\\><C-N><C-w>l", opts_ns)

    -- Highlight last inserted text
    map('n', 'gV', '`[v]`', opts_ns)
