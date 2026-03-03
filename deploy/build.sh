#!/usr/bin/env bash
# Apply config, build frontend and backend
# Run from project root: ./deploy/build.sh

[ -z "$BASH_VERSION" ] && exec /usr/bin/env bash "$0" "$@"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "== 1. Apply config =="
"$SCRIPT_DIR/apply-config.sh"

echo ""
echo "== 2. Build frontend =="
npm run build -w apps/web

echo ""
echo "== 3. Build backend =="
npm run build -w apps/api

echo ""
echo "Done. Run ./deploy/copy-to-vm.sh to upload to VM."
