#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/project.yml"
FRAMEWORK="$ROOT/Frameworks/llama.xcframework"
WEB="$ROOT/www"

fail() { echo "[iOS preflight] ERROR: $*" >&2; exit 1; }
info() { echo "[iOS preflight] $*"; }

[ -f "$PROJECT" ] || fail "project.yml missing"
[ -d "$FRAMEWORK" ] || fail "llama.xcframework missing"
[ -f "$ROOT/Fantasyac/Fantasyac-Bridging-Header.h" ] || fail "bridging header missing"
[ -f "$WEB/index.html" ] || fail "www/index.html missing; run sync_web_assets.sh"
[ -f "$WEB/game-runtime.json" ] || fail "www/game-runtime.json missing"

grep -q 'deploymentTarget: "16.4"' "$PROJECT" || fail "deploymentTarget must be iOS 16.4"
grep -q 'SWIFT_VERSION: "5.0"' "$PROJECT" || fail "SWIFT_VERSION must use explicit Swift 5 language mode"
grep -q 'SWIFT_STRICT_CONCURRENCY: minimal' "$PROJECT" || fail "Swift concurrency compatibility mode must be explicit"
grep -q 'IPHONEOS_DEPLOYMENT_TARGET: "16.4"' "$PROJECT" || fail "IPHONEOS_DEPLOYMENT_TARGET must be explicit"
grep -q 'SUPPORTED_PLATFORMS: "iphoneos iphonesimulator"' "$PROJECT" || fail "SUPPORTED_PLATFORMS must include iPhoneOS and simulator"
grep -q 'path: www' "$PROJECT" || fail "www folder reference missing from XcodeGen project"
grep -q 'buildPhase: resources' "$PROJECT" || fail "www folder must be copied in Resources build phase"
grep -q 'embed: true' "$PROJECT" || fail "llama.xcframework must be embedded"
! grep -q 'HEADER_SEARCH_PATHS:.*ios-arm64' "$PROJECT" || fail "hard-coded XCFramework slice header path is forbidden"

HEADER="$(find "$FRAMEWORK" -type f \( -name 'llama.h' -o -path '*/Headers/llama.h' \) -print -quit)"
[ -n "$HEADER" ] || fail "llama.h not found in XCFramework"

# Verify the XCFramework actually contains a device arm64 slice. Simulator support is
# detected as well so Validate can compile it when available.
XCINFO="$FRAMEWORK/Info.plist"
[ -f "$XCINFO" ] || fail "XCFramework Info.plist missing"
python3 - "$XCINFO" <<'PYXC'
import plistlib, sys
path=sys.argv[1]
with open(path, 'rb') as f:
    root=plistlib.load(f)
libs=root.get('AvailableLibraries') or []
def archs(item):
    return set(item.get('SupportedArchitectures') or [])
device=[x for x in libs if x.get('SupportedPlatform') == 'ios' and not x.get('SupportedPlatformVariant') and 'arm64' in archs(x)]
sim=[x for x in libs if x.get('SupportedPlatform') == 'ios' and x.get('SupportedPlatformVariant') == 'simulator']
if not device:
    raise SystemExit('llama.xcframework has no iOS arm64 device slice')
print('[iOS preflight] XCFramework device slice:', device[0].get('LibraryIdentifier', 'unknown'))
print('[iOS preflight] XCFramework simulator slice:', sim[0].get('LibraryIdentifier', 'none') if sim else 'none')
PYXC

# Keep the native bridge locked to the exact llama.cpp API family used by the pinned binary.
for api in llama_backend_init llama_model_default_params llama_model_load_from_file llama_model_has_decoder llama_model_has_encoder llama_model_free llama_context_default_params llama_init_from_model llama_model_get_vocab llama_model_chat_template llama_chat_apply_template llama_tokenize llama_sampler_chain_init llama_sampler_chain_add llama_sampler_init_top_p llama_sampler_init_temp llama_sampler_init_dist llama_batch_get_one llama_get_memory llama_memory_seq_pos_max llama_n_ctx llama_decode llama_sampler_sample llama_vocab_is_eog llama_token_to_piece llama_sampler_free llama_free; do
  grep -q "$api" "$HEADER" || fail "Pinned llama.h missing required API: $api"
done

LOCAL_AI="$ROOT/Fantasyac/AI/LocalAIEngine.swift"
BRIDGE_MM="$ROOT/Fantasyac/AI/FantasyacLlamaBridge.mm"
grep -q 'inferenceInFlight' "$LOCAL_AI" || fail "local inference concurrency guard missing"
grep -q 'llama_token nextToken' "$BRIDGE_MM" || fail "persistent next-token storage missing"
! grep -q 'llama_token next = tok' "$BRIDGE_MM" || fail "dangling next-token batch pattern remains"
grep -q 'cp.n_batch = (uint32_t)_contextSize' "$BRIDGE_MM" || fail "prompt batch hardening missing"
grep -q 'tmpl != nullptr' "$BRIDGE_MM" || fail "chat-template null guard missing"
grep -q 'Unsupported GGUF architecture' "$BRIDGE_MM" || fail "decoder-only model guard missing"
grep -q 'FantasyacLlamaBridgeBox: @unchecked Sendable' "$LOCAL_AI" || fail "GCD inference Sendable bridge wrapper missing"

MODEL_MANAGER="$ROOT/Fantasyac/AI/ModelManager.swift"
KEYSTORE="$ROOT/Fantasyac/AI/SecureGeminiKeyStore.swift"
GAME_CONTENT="$ROOT/Fantasyac/Runtime/GameContentManager.swift"
WEBVIEW="$ROOT/Fantasyac/Web/FantasyacWebViewContainer.swift"
grep -q 'if let suppliedSize' "$MODEL_MANAGER" || fail "Xcode 26 throwing nil-coalescing hotfix missing from ModelManager"
grep -q 'guard FileManager.default.createFile' "$MODEL_MANAGER" || fail "model import temporary-file creation guard missing"
grep -q 'SecureGeminiKeyStore: @unchecked Sendable' "$KEYSTORE" || fail "Keychain wrapper Sendable compatibility marker missing"
grep -q 'GameContentManager: @unchecked Sendable' "$GAME_CONTENT" || fail "game runtime manager Sendable compatibility marker missing"
grep -q 'Task { @MainActor in' "$WEBVIEW" || fail "WKWebView external URL MainActor hop missing"

PLIST="$(find "$FRAMEWORK" -path '*/llama.framework/Info.plist' -print | grep -E 'ios-arm64|iphoneos' | head -n1 || true)"
if [ -z "$PLIST" ]; then PLIST="$(find "$FRAMEWORK" -path '*/llama.framework/Info.plist' -print | head -n1 || true)"; fi
if [ -n "$PLIST" ] && command -v /usr/libexec/PlistBuddy >/dev/null 2>&1; then
  MIN_OS="$(/usr/libexec/PlistBuddy -c 'Print :MinimumOSVersion' "$PLIST" 2>/dev/null || true)"
  info "llama framework MinimumOSVersion=${MIN_OS:-unknown}"
  if [ -n "$MIN_OS" ]; then
    python3 - "$MIN_OS" <<'PY2'
import sys
v=tuple(int(x) for x in sys.argv[1].split('.')[:2])
if v > (16,4):
    raise SystemExit(f"Downloaded llama framework requires iOS {sys.argv[1]}, higher than app deployment target 16.4")
PY2
  fi
fi

grep -Eq 'GENERATE_INFOPLIST_FILE:[[:space:]]*YES' "$PROJECT" || fail "GENERATE_INFOPLIST_FILE: YES missing"
info "Preflight passed"
