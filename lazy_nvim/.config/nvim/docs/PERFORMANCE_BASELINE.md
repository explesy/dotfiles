# Performance Baseline

Date: 2026-03-11  
Target: startup responsiveness and stable interaction after config changes.

## Measurement Method

Startup timing (3 runs):

```bash
nvim --startuptime /tmp/nvim-startup-1.log -u init.lua -i NONE +qa
nvim --startuptime /tmp/nvim-startup-2.log -u init.lua -i NONE +qa
nvim --startuptime /tmp/nvim-startup-3.log -u init.lua -i NONE +qa
```

Read total startup line:

```bash
awk '/NVIM STARTED/{line=$0} END{print line}' /tmp/nvim-startup-*.log
```

## Baseline Results (Before Cleanup)

- Run 1: `56.936 ms`
- Run 2: `42.830 ms`
- Run 3: `42.881 ms`
- Average: `47.549 ms` (n=3)

## Post-Cleanup Results

After:
- disabling startup auto-install of missing plugins (`install.missing = false`),
- disabling `matchit`, `matchparen`, `netrwPlugin`,
- setting `neo-tree` watcher to `false`,
- reducing custom colorscheme plugin list.

Results:
- Run 1: `63.356 ms` (cold-ish run)
- Run 2: `34.592 ms`
- Run 3: `35.094 ms`
- Average: `44.347 ms` (n=3)

## Current Hotspots (from startuptime logs)

- `require('config.lazy')`: major startup block (largest aggregate segment).
- `gruvbox-material/colors/gruvbox-material.vim`: noticeable colorscheme load cost.
- `require('snacks')`: visible but moderate startup contribution.

## Interpretation

- Warm startup is around mid-30ms after cleanup.
- First run after changes is higher (cold-ish path), then stabilizes.
- Main optimization path is reducing startup plugin surface and background watchers.

## Next Refresh Rule

Re-run this baseline after:
- adding/removing plugins,
- changing colorscheme stack,
- changing `lua/config/lazy.lua` performance settings.
