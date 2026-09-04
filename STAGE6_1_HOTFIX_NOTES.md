# Stage 6.1 first CI run hotfix

Fixes discovered by the first real GitHub Actions build:

1. Windows: PowerShell treated `$UPDATE_MANIFEST_URL` as a local variable instead of an environment variable. Release workflow now injects the GitHub Actions expression directly, which works on Windows/Linux/macOS.
2. Android: Java compilation defaulted to JVM 1.8 while Kotlin compiled for JVM 17. Both targets are now explicitly JVM 17.
3. iOS/iPadOS: the XCFramework preparation script used unauthenticated `api.github.com` release discovery and hit HTTP 403 rate limiting on a shared macOS runner. It now downloads the pinned release asset directly: `llama-<ref>-xcframework.zip`, with retries.
4. GitHub Actions runtime warnings: checkout/setup-node/setup-java are moved to current Node-24-based major versions.
5. ZIP updater: `.github` is no longer excluded by `unpack.yml`, so future full project ZIP updates can update workflows too.

No signing secret values are changed. No save/user-content data is changed.
