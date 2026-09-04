#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="$(cd "$(dirname "$0")/.." && pwd)/app/src/main/assets/www"
rm -rf "$DEST"
mkdir -p "$DEST"
if [ ! -d "$ROOT/dist" ]; then
  echo "dist/ not found. Run npm install && npm run build first." >&2
  exit 1
fi
cp -a "$ROOT/dist/." "$DEST/"
rm -f "$DEST/server.cjs" "$DEST"/*.map 2>/dev/null || true
echo "Synced web assets to $DEST"
