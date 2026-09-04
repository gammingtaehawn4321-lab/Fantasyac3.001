#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:?game version required}"
MIN_LAUNCHER="${2:?minimum launcher version required}"
OUT_DIR="${3:-release-out}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

VERSION_RE='^[0-9]+(\.[0-9]+){2,3}([-+][A-Za-z0-9.-]+)?$'
[[ "$VERSION" =~ $VERSION_RE ]] || { echo "invalid game version: $VERSION" >&2; exit 2; }
[[ "$MIN_LAUNCHER" =~ $VERSION_RE ]] || { echo "invalid minimum launcher version: $MIN_LAUNCHER" >&2; exit 2; }

test -f dist/index.html || { echo 'dist/index.html missing; run npm run build first' >&2; exit 1; }
test -f dist/game-runtime.json || { echo 'dist/game-runtime.json missing' >&2; exit 1; }
RUNTIME_VERSION="$(node -e "const x=require('fs').readFileSync('dist/game-runtime.json','utf8'); const v=JSON.parse(x).gameVersion; process.stdout.write(String(v||''))")"
[[ "$RUNTIME_VERSION" == "$VERSION" ]] || {
  echo "dist/game-runtime.json version $RUNTIME_VERSION does not match requested game version $VERSION" >&2
  exit 1
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude 'server.cjs' --exclude '*.map' dist/ "$TMP/"
cat > "$TMP/game-patch.json" <<JSON
{
  "schemaVersion": 1,
  "gameVersion": "$VERSION",
  "minimumLauncherVersion": "$MIN_LAUNCHER",
  "format": "ZIP_STORE_V1"
}
JSON
mkdir -p "$OUT_DIR"
OUT_DIR_ABS="$(cd "$OUT_DIR" && pwd)"
OUT="$OUT_DIR_ABS/Fantasyac-Game-v${VERSION}.zip"
rm -f "$OUT"
(
  cd "$TMP"
  # iOS launcher intentionally supports this deterministic, dependency-free stored ZIP profile.
  zip -0 -X -q -r "$OUT" .
)
echo "$OUT"
