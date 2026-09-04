# iOS Validate Xcode 26 Hotfix

- Fixed Xcode 26.6 Swift compile failure in `native/ios/Fantasyac/AI/ModelManager.swift`.
- Root cause: a throwing `FileManager.attributesOfItem` call was placed in the right-hand autoclosure of the nil-coalescing operator (`??`), which triggers a `rethrows` compile error.
- Replaced the expression with an explicit `if let suppliedSize` branch and a separate throwing file-attribute lookup.
- No gameplay, age-policy, save, Android, web, or model-selection behavior was changed.
