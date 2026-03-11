return {
  -- YAML LSP + remote schema loading can make compose files feel like they hang.
  -- Keep YAML editing simple and stable for now.
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        yamlls = {
          enabled = false,
        },
      },
    },
  },
  { "b0o/SchemaStore.nvim", enabled = false },
}
