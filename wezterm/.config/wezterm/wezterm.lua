-- Pull in the wezterm API
local wezterm = require 'wezterm'

local mux = wezterm.mux
local act = wezterm.action

-- For maximizing window on start
wezterm.on('gui-startup', function()
  local tab, pane, window = mux.spawn_window({})
  window:gui_window():maximize()
end)

-- This table will hold the configuration.
local config = {}

-- In newer versions of wezterm, use the config_builder which will
-- help provide clearer error messages
if wezterm.config_builder then
  config = wezterm.config_builder()
end

-- This is where you actually apply your config choices
config.color_scheme = 'AdventureTime'
config.default_prog = { 'zsh', '-l' }
config.window_padding = {
  left = 0,
  right = 0,
  top = 0,
  bottom = 0,
}
config.use_dead_keys = false
-- config.font = wezterm.font '0xProtoNerdFont'
config.font = wezterm.font 'JetBrainsMono Nerd Font'

--config.window_decorations = "RESIZE"

-- and finally, return the configuration to wezterm
return config
