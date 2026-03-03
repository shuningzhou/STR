#!/usr/bin/env bash
# Generate deploy/nginx-str.conf from template using deploy.config
# Run from project root or deploy/

[ -z "$BASH_VERSION" ] && exec /usr/bin/env bash "$0" "$@"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$SCRIPT_DIR/nginx-str.conf.template"
OUTPUT="$SCRIPT_DIR/nginx-str.conf"

# shellcheck source=deploy/load-config.sh
. "$SCRIPT_DIR/load-config.sh"

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: nginx-str.conf.template not found at $TEMPLATE" >&2
  exit 1
fi

sed -e "s/{{DOMAIN_NAME}}/$DOMAIN_NAME/g" \
    -e "s/{{SERVER_IP}}/$SERVER_IP/g" \
    "$TEMPLATE" > "$OUTPUT"

echo "Generated $OUTPUT (DOMAIN_NAME=$DOMAIN_NAME, SERVER_IP=$SERVER_IP)"
