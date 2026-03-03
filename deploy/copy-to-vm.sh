#!/usr/bin/env bash
# Copy builds and deploy scripts to VM
# Run from project root: ./deploy/copy-to-vm.sh

[ -z "$BASH_VERSION" ] && exec /usr/bin/env bash "$0" "$@"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy/load-config.sh
. "$SCRIPT_DIR/load-config.sh"

echo "== Generate apps/api/.env from deploy.config =="
"$SCRIPT_DIR/generate-api-env.sh" > "$ROOT/apps/api/.env"

echo ""
echo "== Copy to VM (root@${SERVER_IP}:/root/STR/) =="
echo "Press Enter to start upload (enter SSH password when rsync prompts)..."
read -r

rsync -avz \
  --include 'apps/api/.env' \
  --exclude '*.env' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.cursor' \
  --exclude 'deploy_old' \
  "$ROOT/" \
  "root@${SERVER_IP}:/root/STR/"

echo ""
echo "Done. App: https://${DOMAIN_NAME}"
