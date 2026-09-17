#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GEMINI_HOME="${GEMINI_HOME:-$HOME/.gemini}"

link_file() {
  local source_path="$1"
  local target_path="$2"

  if [[ -L "$target_path" && "$(readlink "$target_path")" == "$source_path" ]]; then
    printf 'Already linked: %s -> %s\n' "$target_path" "$source_path"
    return
  fi

  if [[ -e "$target_path" && ! -L "$target_path" ]]; then
    local backup_path="${target_path}.bak.$(date +%s)"
    printf 'Backing up existing file: %s -> %s\n' "$target_path" "$backup_path"
    mv "$target_path" "$backup_path"
  elif [[ -L "$target_path" ]]; then
    rm -f "$target_path"
  fi

  mkdir -p "$(dirname "$target_path")"
  ln -s "$source_path" "$target_path"
  printf 'Linked: %s -> %s\n' "$target_path" "$source_path"
}

mkdir -p "$GEMINI_HOME/antigravity-cli"
mkdir -p "$GEMINI_HOME/config"

# Link CLI settings
link_file "$DOTFILES_DIR/antigravity/.gemini/antigravity-cli/settings.json" "$GEMINI_HOME/antigravity-cli/settings.json"

# Link global Antigravity config
link_file "$DOTFILES_DIR/antigravity/.gemini/config/config.json" "$GEMINI_HOME/config/config.json"
link_file "$DOTFILES_DIR/antigravity/.gemini/config/mcp_config.json" "$GEMINI_HOME/config/mcp_config.json"
link_file "$DOTFILES_DIR/antigravity/.gemini/config/AGENTS.md" "$GEMINI_HOME/config/AGENTS.md"

printf '\n✓ Antigravity & agy configurations successfully linked from %s\n' "$DOTFILES_DIR/antigravity"
