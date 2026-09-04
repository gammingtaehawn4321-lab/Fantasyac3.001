#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:?version required}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
IOS="$ROOT/native/ios"
OUT="$ROOT/release-out"
BUNDLE_ID="com.fantasyac.game"
mkdir -p "$OUT"
: "${CERT_B64:?}" "${CERT_PASS:?}" "${PROFILE_B64:?}" "${TEAM_ID:?}"
KEYCHAIN="$RUNNER_TEMP/fantasyac-signing.keychain-db"
KEYCHAIN_PASS="fantasyac-ci-$(date +%s)"
cleanup() { security delete-keychain "$KEYCHAIN" >/dev/null 2>&1 || true; rm -f "$RUNNER_TEMP/cert.p12" "$RUNNER_TEMP/profile.mobileprovision"; }
trap cleanup EXIT

printf '%s' "$CERT_B64" | /usr/bin/base64 -D > "$RUNNER_TEMP/cert.p12"
printf '%s' "$PROFILE_B64" | /usr/bin/base64 -D > "$RUNNER_TEMP/profile.mobileprovision"
security create-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASS" "$KEYCHAIN"
security import "$RUNNER_TEMP/cert.p12" -k "$KEYCHAIN" -P "$CERT_PASS" -T /usr/bin/codesign
security list-keychains -d user -s "$KEYCHAIN" login.keychain-db
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASS" "$KEYCHAIN"
IDENTITY_COUNT="$(security find-identity -v -p codesigning "$KEYCHAIN" | awk '/valid identities found/ {print $1}')"
[[ "${IDENTITY_COUNT:-0}" -ge 1 ]] || { echo 'No valid code-signing identity was imported from IOS_CERT_P12_BASE64' >&2; exit 2; }
security cms -D -i "$RUNNER_TEMP/profile.mobileprovision" > "$RUNNER_TEMP/profile.plist"
python3 - "$RUNNER_TEMP/profile.plist" <<'PYPROFILE'
import datetime, plistlib, sys
with open(sys.argv[1], 'rb') as f:
    p=plistlib.load(f)
expires=p.get('ExpirationDate')
if not isinstance(expires, datetime.datetime):
    raise SystemExit('Provisioning profile has no valid ExpirationDate')
now=datetime.datetime.now(datetime.timezone.utc)
if expires.tzinfo is None:
    expires=expires.replace(tzinfo=datetime.timezone.utc)
if expires <= now:
    raise SystemExit(f'Provisioning profile expired at {expires.isoformat()}')
print('Provisioning profile expires:', expires.isoformat())
PYPROFILE
UUID="$(/usr/libexec/PlistBuddy -c 'Print UUID' "$RUNNER_TEMP/profile.plist")"
PROFILE_NAME="$(/usr/libexec/PlistBuddy -c 'Print Name' "$RUNNER_TEMP/profile.plist")"
PROFILE_TEAM="$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$RUNNER_TEMP/profile.plist" 2>/dev/null || true)"
APP_ID="$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$RUNNER_TEMP/profile.plist" 2>/dev/null || true)"
[[ -n "$UUID" && -n "$PROFILE_NAME" ]] || { echo 'Provisioning profile metadata is incomplete' >&2; exit 2; }
[[ -z "$PROFILE_TEAM" || "$PROFILE_TEAM" == "$TEAM_ID" ]] || { echo "Provisioning profile team ($PROFILE_TEAM) does not match IOS_TEAM_ID ($TEAM_ID)" >&2; exit 2; }
[[ "$APP_ID" == "$TEAM_ID.$BUNDLE_ID" || "$APP_ID" == "$TEAM_ID.*" ]] || { echo "Provisioning profile application-identifier ($APP_ID) does not match $BUNDLE_ID" >&2; exit 2; }

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$RUNNER_TEMP/profile.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/$UUID.mobileprovision"

GET_TASK_ALLOW="$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:get-task-allow' "$RUNNER_TEMP/profile.plist" 2>/dev/null || echo false)"
PROVISIONS_ALL="$(/usr/libexec/PlistBuddy -c 'Print :ProvisionsAllDevices' "$RUNNER_TEMP/profile.plist" 2>/dev/null || echo false)"
DEVICE0="$(/usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices:0' "$RUNNER_TEMP/profile.plist" 2>/dev/null || true)"
if [[ "$PROVISIONS_ALL" == "true" ]]; then
  EXPORT_METHOD="enterprise"
elif [[ -n "$DEVICE0" && "$GET_TASK_ALLOW" == "true" ]]; then
  EXPORT_METHOD="debugging"
elif [[ -n "$DEVICE0" ]]; then
  EXPORT_METHOD="release-testing"
else
  EXPORT_METHOD="app-store-connect"
fi
echo "iOS export method: $EXPORT_METHOD"

cd "$IOS"
xcodebuild -project Fantasyac.xcodeproj -scheme Fantasyac -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$RUNNER_TEMP/Fantasyac.xcarchive" archive \
  DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Manual PROVISIONING_PROFILE_SPECIFIER="$PROFILE_NAME"

cat > "$RUNNER_TEMP/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>$EXPORT_METHOD</string>
<key>signingStyle</key><string>manual</string>
<key>teamID</key><string>$TEAM_ID</string>
<key>provisioningProfiles</key><dict><key>$BUNDLE_ID</key><string>$PROFILE_NAME</string></dict>
</dict></plist>
PLIST

xcodebuild -exportArchive -archivePath "$RUNNER_TEMP/Fantasyac.xcarchive" -exportPath "$RUNNER_TEMP/export" -exportOptionsPlist "$RUNNER_TEMP/ExportOptions.plist"
IPA="$(find "$RUNNER_TEMP/export" -name '*.ipa' -print -quit)"
[[ -n "$IPA" && -f "$IPA" ]] || { echo 'IPA export completed without an .ipa file' >&2; exit 3; }
cp "$IPA" "$OUT/Fantasyac-iPadOS-v$VERSION.ipa"
cp "$IPA" "$OUT/Fantasyac-iOS-v$VERSION.ipa"
