#!/usr/bin/env bash
set -e

# STR - Strategy Investment Tracker
# Starts frontend (Vite) + backend (NestJS) concurrently

cd "$(dirname "$0")"

# ── Kill any leftover processes on our ports ──
for port in 3001 5173; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing leftover process(es) on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

# ── Clean stale build cache & rebuild backend to avoid watch-mode race ──
echo "Building backend..."
rm -f apps/api/tsconfig.tsbuildinfo
(cd apps/api && npx nest build)
echo ""

echo "Starting STR development servers..."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""

# Open browser after a short delay to let Vite start
(sleep 3 && open http://localhost:5173) &

npx concurrently \
  -n "web,api" \
  -c "cyan,green" \
  "npm run dev -w apps/web" \
  "npm run start:dev -w apps/api"
