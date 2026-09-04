#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IOS_ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="$IOS_ROOT/www"
rm -rf "$DEST"
mkdir -p "$DEST"
if [ ! -d "$ROOT/dist" ]; then
  echo "dist/ not found. Run npm install && npm run build first." >&2
  exit 1
fi
rsync -a --delete --exclude 'server.cjs' --exclude '*.map' "$ROOT/dist/" "$DEST/"
test -f "$DEST/index.html" || { echo 'iOS web bundle missing index.html' >&2; exit 1; }
test -f "$DEST/game-runtime.json" || { echo 'iOS web bundle missing game-runtime.json' >&2; exit 1; }
echo "Synced web assets to $DEST"
