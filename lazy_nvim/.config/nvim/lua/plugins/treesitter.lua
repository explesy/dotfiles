-- tree browser
return {
  require("neo-tree").setup({
    filesystem = {
      window = {
        mappings = {
          ["e"] = "none"
        }
      }
    }
  })
}
