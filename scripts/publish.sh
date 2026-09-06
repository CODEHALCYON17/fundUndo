#!/bin/bash
# Runs the funding pipeline for real, regenerates docs/index.html, and pushes
# it to GitHub so GitHub Pages picks up the update. Meant to be run from cron
# (see the crontab entry set up alongside this script) - cron's environment
# is minimal, so PATH is set explicitly rather than assumed.
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
PROJECT_DIR="/Users/agu/Project-FT/FundUndo"
cd "$PROJECT_DIR"

echo "===== $(date -u '+%Y-%m-%d %H:%M:%S UTC') - starting run ====="

npm run build
node dist/index.js

# Only commit/push if the site actually changed - avoids empty daily commits
# on days nothing new/changed was found.
if ! git diff --quiet -- docs/ || ! git diff --cached --quiet -- docs/; then
  git add docs/
  git commit -m "Update FundUndo site - $(date -u '+%Y-%m-%d %H:%M UTC')"
  git push origin main
  echo "Site updated and pushed."
else
  echo "No site changes - nothing to push."
fi

echo "===== $(date -u '+%Y-%m-%d %H:%M:%S UTC') - done ====="
