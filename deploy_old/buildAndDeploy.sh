#!/usr/bin/env bash
# Apply config, build frontend, and copy entire project to VM
# Run from project root: ./buildAndDeploy.sh

[ -z "$BASH_VERSION" ] && exec /usr/bin/env bash "$0" "$@"

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "== 1. Apply config =="
"$ROOT/deploy/apply-config.sh"

echo ""
echo "== 2. Build frontend =="
cd "$ROOT/frontend"
npm run build
cd "$ROOT"

echo ""
echo "== 3. Copy to VM =="
# shellcheck source=deploy/load-config.sh
. "$ROOT/deploy/load-config.sh"
echo "Press Enter to start upload (enter SSH password when rsync prompts)..."
read -r
rsync -avz --exclude 'node_modules' --exclude '.venv' \
  --exclude 'backend/data/credentials.json' \
  --exclude 'backend/data/*.csv' \
  "$ROOT/" \
  "root@${SERVER_IP}:/root/TradeReporter/"

echo ""
echo "Done. App: https://${DOMAIN_NAME}"
