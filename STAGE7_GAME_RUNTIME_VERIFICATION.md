# Stage 7 Game Runtime Split Verification

Date: 2026-09-01

## Static checks

- TypeScript/TSX parser: 0 syntax errors across `src/`.
- iOS Swift parser: all Swift files pass `swiftc -parse`.
- GitHub Actions YAML: `release.yml`, `validate.yml`, `game-patch.yml`, `unpack.yml` parse successfully.
- Shell syntax: game bundle packaging and existing native sync/preflight scripts pass `bash -n`.
- Android `GameContentManager.kt`: Kotlin compiler syntax/type smoke check passed with Android/JSONObject stubs; only non-fatal warnings.
- `scripts/release/check_release_tree.mjs`: pass.

## Game patch package smoke test

A synthetic `dist/` was packaged with `package_game_bundle.sh` and verified that:

- archive uses `ZIP_STORE_V1` local entries (method 0)
- no encrypted entries
- no data-descriptor entries
- includes `index.html`
- includes `game-runtime.json`
- includes `game-patch.json`
- `unzip -t` reports no archive errors
- generated game manifest contains SHA-256, size, minimum launcher version and stable asset URL

## Preservation

`src/user_content/petReferences.ts` is byte-for-byte identical to the 6.7 baseline.
SHA-256: `18981e6b6f290ec94d6279b8aea24fc44cef1a4fa8dfb9f9e1c21f40d150ac8e`

No files from the 6.7 baseline were deleted.

## Requires GitHub CI confirmation

This container does not have the Android SDK/NDK or Xcode iOS SDK, so the final native link/build must still be confirmed by the existing GitHub Actions release pipeline after upload. The previous 6.7 baseline had already passed Windows/Android/iOS CI; Stage 7 changes introduce the new native game-content managers and therefore should receive one new CI run before installing the 3.3.2 launcher.
