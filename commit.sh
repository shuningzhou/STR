#!/usr/bin/env bash
set -e

# Add all changes and commit with optional message
# Usage: ./commit.sh [message]
# If no message provided, uses "Update" as default

cd "$(dirname "$0")"

MESSAGE="${1:-Update}"

git add -A
git commit -m "$MESSAGE"
