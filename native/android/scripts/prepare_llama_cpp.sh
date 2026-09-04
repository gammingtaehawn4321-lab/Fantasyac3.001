#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/third_party/llama.cpp"
# Stage 4 pins the source through this lock file. Change it only after native regression tests.
REF="$(cat "$ROOT/third_party/LLAMA_CPP_REF" 2>/dev/null || echo master)"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" fetch --depth 1 origin "$REF"
else
  mkdir -p "$(dirname "$DEST")"
  git clone https://github.com/ggml-org/llama.cpp.git "$DEST"
  git -C "$DEST" fetch --depth 1 origin "$REF"
fi
git -C "$DEST" checkout --detach FETCH_HEAD
printf 'llama.cpp ready: %s @ %s\n' "$DEST" "$(git -C "$DEST" rev-parse HEAD)"
