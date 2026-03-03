#!/usr/bin/env bash
# Generate apps/api/.env from deploy.config (API vars only)
# Keys: MONGODB_URI, PORT, EODHD_API_TOKEN, MASSIVE_API_KEY, JWT_SECRET, JWT_EXPIRES_IN, RESEND_API_KEY, EMAIL_FROM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
CONFIG="$SCRIPT_DIR/deploy.config"
API_KEYS="MONGODB_URI PORT EODHD_API_TOKEN MASSIVE_API_KEY JWT_SECRET JWT_EXPIRES_IN RESEND_API_KEY EMAIL_FROM"

while IFS= read -r line; do
  line="$(echo "$line" | sed 's/#.*//')"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -z "$line" ] && continue
  key="${line%%=*}"
  key="${key// /}"
  case " $API_KEYS " in
    *" $key "*) echo "$line" ;;
  esac
done < "$CONFIG"
