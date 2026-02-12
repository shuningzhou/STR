#!/usr/bin/env bash
set -e

# STR - Strategy Investment Tracker
# Starts all dev servers concurrently

cd "$(dirname "$0")"

echo "Starting STR development servers..."
echo ""

# Open browser after a short delay to let Vite start
(sleep 2 && open http://localhost:5173) &

# For now, only the frontend is scaffolded
npx concurrently \
  -n "web" \
  -c "cyan" \
  "npm run dev -w apps/web"
