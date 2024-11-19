-- Pull in the wezterm API
local wezterm = require("wezterm")

-- Use the config_builder in newer versions of wezterm
local config = wezterm.config_builder and wezterm.config_builder() or {}

-- Startup configuration
wezterm.on("gui-startup", function(cmd)
	local tab, pane, window = wezterm.mux.spawn_window(cmd or {})
	window:gui_window():maximize()
	-- window:perform_action(wezterm.action.ToggleFullScreen, pane)
end)

-- Appearance
config.color_scheme = "Afterglow (Gogh)"
config.font = wezterm.font("JetBrainsMono Nerd Font")
config.font_size = 18.0
config.max_fps = 120
-- config.window_decorations = "NONE"
-- config.enable_tab_bar = false

config.window_padding = {
	left = 0,
	right = 0,
	top = 0,
	bottom = 0,
}

config.hide_tab_bar_if_only_one_tab = true
-- config.tab_bar_at_bottom = true
config.show_tab_index_in_tab_bar = true

config.inactive_pane_hsb = {
	saturation = 0.9,
	brightness = 0.3,
}

-- Behavior
config.default_prog = { "/opt/homebrew/bin/fish", "-l" }
config.use_dead_keys = false
config.window_close_confirmation = "NeverPrompt"
config.animation_fps = 60

-- Key bindings
config.keys = {
	{
		key = "t",
		mods = "SHIFT|CTRL",
		action = wezterm.action.SpawnTab("CurrentPaneDomain"),
	},
	{
		key = "f",
		mods = "SHIFT|CTRL",
		action = wezterm.action.ToggleFullScreen,
	},
}

-- Custom color for status line
-- config.colors = {
-- 	tab_bar = {
-- 		background = "#282c34",
-- 		active_tab = {
-- 			bg_color = "#61afef",
-- 			fg_color = "#282c34",
-- 		},
-- 		inactive_tab = {
-- 			bg_color = "#353b45",
-- 			fg_color = "#abb2bf",
-- 		},
-- 	},
-- }

-- Custom command palette
config.command_palette_fg_color = "#abb2bf"
config.command_palette_bg_color = "#282c34"

return config
