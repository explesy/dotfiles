#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"

ensure_link() {
  local source_path="$1"
  local target_path="$2"

  if [[ -L "$target_path" && "$(readlink "$target_path")" == "$source_path" ]]; then
    return
  fi
  if [[ -e "$target_path" || -L "$target_path" ]]; then
    printf 'Refusing to replace existing path: %s\n' "$target_path" >&2
    exit 1
  fi
  ln -s "$source_path" "$target_path"
}

validate_pet() {
  local pet_path="$1"

  jq -e '
    (.id | type == "string" and length > 0) and
    (.displayName | type == "string" and length > 0) and
    .spriteVersionNumber == 2 and
    .spritesheetPath == "spritesheet.webp"
  ' "$pet_path/pet.json" >/dev/null
  [[ -s "$pet_path/spritesheet.webp" ]]
}

mkdir -p "$CODEX_HOME_DIR"

ensure_link "$DOTFILES_DIR/codex/config.toml" "$CODEX_HOME_DIR/config.toml"
ensure_link "$DOTFILES_DIR/codex/AGENTS.md" "$CODEX_HOME_DIR/AGENTS.md"
ensure_link "$DOTFILES_DIR/codex/agents" "$CODEX_HOME_DIR/agents"
ensure_link "$DOTFILES_DIR/codex/pets" "$CODEX_HOME_DIR/pets"

for pet_path in "$DOTFILES_DIR"/codex/pets/*; do
  [[ -d "$pet_path" ]] || continue
  validate_pet "$pet_path"
done

mkdir -p "$CODEX_HOME_DIR/skills"
for skill_path in "$DOTFILES_DIR"/codex/skills/*; do
  [[ -d "$skill_path" ]] || continue
  skill_name="$(basename "$skill_path")"
  ensure_link "$skill_path" "$CODEX_HOME_DIR/skills/$skill_name"
done

printf 'Codex dotfiles linked from %s\n' "$DOTFILES_DIR/codex"
