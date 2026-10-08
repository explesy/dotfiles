local function disable_lang(opts, section, langs)
  opts[section] = opts[section] or {}
  opts[section].disable = opts[section].disable or {}
  if type(opts[section].disable) ~= "table" then
    return
  end

  local seen = {}
  for _, lang in ipairs(opts[section].disable) do
    seen[lang] = true
  end
  for _, lang in ipairs(langs) do
    if not seen[lang] then
      table.insert(opts[section].disable, lang)
    end
  end
end

return {
  -- Restore Lua highlighting first; retain separate indent/fold/textobject
  -- mitigations until longer interactive use confirms stability.
  { "nvim-treesitter/nvim-treesitter-textobjects", enabled = false },
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      disable_lang(opts, "indent", { "lua" })
      disable_lang(opts, "folds", { "lua" })
    end,
  },
}
