#!/usr/bin/env bash
# Source this to get SERVER_IP, DOMAIN_NAME, DEPLOY_MODE
# Usage: source deploy/load-config.sh  OR  . deploy/load-config.sh
# Must run in bash: bash -c '. deploy/load-config.sh && your-command'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$ROOT/deploy/deploy.config"

if [ ! -f "$CONFIG" ]; then
  echo "Error: deploy/deploy.config not found at $CONFIG" >&2
  return 1 2>/dev/null || exit 1
fi

while IFS= read -r line; do
  line="$(echo "$line" | sed 's/#.*//')"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -z "$line" ] && continue
  case "$line" in (*=*) export "$line" ;; esac
done < "$CONFIG"
