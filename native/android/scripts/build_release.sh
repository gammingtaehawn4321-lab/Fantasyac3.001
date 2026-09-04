#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
echo '[Fantasyac] Web assets build/sync'
npm install
npm run build
bash native/android/scripts/sync_web_assets.sh
bash native/android/scripts/prepare_llama_cpp.sh
cd native/android
if [[ -x ./gradlew ]]; then
  ./gradlew assembleRelease
elif command -v gradle >/dev/null 2>&1; then
  gradle assembleRelease
else
  echo 'Gradle wrapper/Gradle이 없습니다. Android Studio에서 native/android를 열어 Build > Generate Signed App Bundle or APK를 사용하세요.' >&2
  exit 2
fi
