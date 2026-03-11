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
  -- Workaround: this setup is unstable for some parsers/queries, so keep them
  -- disabled consistently across all Tree-sitter features.
  { "nvim-treesitter/nvim-treesitter-textobjects", enabled = false },
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      disable_lang(opts, "highlight", { "lua", "markdown", "markdown_inline" })
      disable_lang(opts, "indent", { "lua", "markdown" })
      disable_lang(opts, "folds", { "lua", "markdown", "markdown_inline" })
    end,
  },
}
