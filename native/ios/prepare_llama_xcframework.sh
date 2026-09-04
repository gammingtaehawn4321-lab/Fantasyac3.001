#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REF="$(tr -d '[:space:]' < "$ROOT/../third_party/LLAMA_CPP_REF")"
FRAMEWORK_DIR="$ROOT/Frameworks"
mkdir -p "$FRAMEWORK_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

case "$REF" in
  b10516) EXPECTED_SHA256="fecab1f0b6e3ba917511b1c1cbcc6a382b154cb62d42e506135df47341e53223" ;;
  *) echo "No pinned SHA-256 is registered for llama.cpp $REF. Update prepare_llama_xcframework.sh deliberately before changing LLAMA_CPP_REF." >&2; exit 2 ;;
esac

URL="https://github.com/ggml-org/llama.cpp/releases/download/${REF}/llama-${REF}-xcframework.zip"
FILE="$TMP/llama-${REF}-xcframework.zip"
echo "Downloading llama.cpp iOS XCFramework: $URL"
curl -L --fail --retry 5 --retry-all-errors --retry-delay 3 "$URL" -o "$FILE"
ACTUAL_SHA256="$(shasum -a 256 "$FILE" | awk '{print $1}')"
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
  echo "llama.cpp XCFramework SHA-256 mismatch" >&2
  echo "expected: $EXPECTED_SHA256" >&2
  echo "actual:   $ACTUAL_SHA256" >&2
  exit 3
fi

mkdir -p "$TMP/unpack"
unzip -q "$FILE" -d "$TMP/unpack"
FOUND="$(find "$TMP/unpack" -type d -name 'llama.xcframework' -print -quit)"
[ -n "$FOUND" ] || { echo 'llama.xcframework not found in release asset' >&2; exit 1; }
rm -rf "$FRAMEWORK_DIR/llama.xcframework"
cp -R "$FOUND" "$FRAMEWORK_DIR/llama.xcframework"
echo "Installed verified $FRAMEWORK_DIR/llama.xcframework from $REF"
