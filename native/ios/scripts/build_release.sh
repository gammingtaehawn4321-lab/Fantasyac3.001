#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
echo '[Fantasyac] Web assets build/sync'
npm install
npm run build
bash native/ios/sync_web_assets.sh
bash native/ios/prepare_llama_xcframework.sh
bash native/ios/scripts/preflight_ios.sh
cd native/ios
if ! command -v xcodegen >/dev/null 2>&1; then echo 'xcodegen이 필요합니다: brew install xcodegen' >&2; exit 2; fi
xcodegen generate
if command -v xcodebuild >/dev/null 2>&1; then
  xcodebuild -project Fantasyac.xcodeproj -scheme Fantasyac -configuration Release -destination 'generic/platform=iOS' build CODE_SIGNING_ALLOWED=NO
else
  echo 'Xcode가 필요합니다. 생성된 Fantasyac.xcodeproj를 Xcode에서 열어 서명 후 Archive하세요.' >&2
fi
