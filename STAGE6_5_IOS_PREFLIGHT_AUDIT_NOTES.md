# Stage 6.5 iOS/iPadOS preflight audit

Proactive fixes after Stage 6.4 Swift importer errors:

- Raised iOS deployment target from 16.0 to 16.4 to match llama.cpp b10516 official XCFramework minimum.
- Explicitly embeds and code-signs `llama.xcframework`; adds framework runpath.
- Adds `native/ios/scripts/preflight_ios.sh` and runs it in GitHub Actions before XcodeGen/build.
- GitHub Release now requires the iOS validation job to succeed, not only Windows/Android.
- iOS signing detection now requires certificate, certificate password, provisioning profile and Team ID.
- macOS signing script now uses `/usr/bin/base64 -D` instead of GNU-only `base64 --decode`.
- Objective-C++ local narrator now sets NSError on every nil/failure path that Swift imports as a throwing non-optional API.
- Preserves Stage 6.4 fixes for Swift importer non-optional return/initializer behavior.
