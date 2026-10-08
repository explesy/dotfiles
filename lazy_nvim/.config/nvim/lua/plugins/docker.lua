return {
  {
    "mason-org/mason.nvim",
    opts = function(_, opts)
      -- Prefer an existing hadolint (e.g. Homebrew on macOS). Avoid downloading
      -- a second copy through Mason when the linter is already available.
      if vim.fn.executable("hadolint") == 1 then
        opts.ensure_installed = vim.tbl_filter(function(name)
          return name ~= "hadolint"
        end, opts.ensure_installed or {})
      end
    end,
  },
}
