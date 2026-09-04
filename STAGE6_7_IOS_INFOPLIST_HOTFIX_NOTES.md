# Stage 6.7 iOS Info.plist hotfix

GitHub Actions Build & Release #4 reached the final iOS app bundle validation, but failed because the built .app had no Info.plist.

Fixes:
- `native/ios/project.yml`: explicitly enable Xcode automatic Info.plist generation with `GENERATE_INFOPLIST_FILE: YES`.
- Existing `INFOPLIST_KEY_*` entries remain the source for display name, launch screen and indirect input support.
- `native/ios/scripts/preflight_ios.sh`: fail early if automatic Info.plist generation is accidentally removed later.

No gameplay, save, Android, Windows, pet reference, or narrator logic was changed.
