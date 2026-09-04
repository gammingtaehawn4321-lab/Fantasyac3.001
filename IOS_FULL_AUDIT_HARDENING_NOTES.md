# iOS Full Audit / Hardening

Current base: Fantasyac 3.3.2 + runtime 7.1 + age policy + lint fixes.

## Fixed
- XcodeGen `SWIFT_VERSION` changed from `5.10` to explicit Swift 5 language mode `"5.0"`.
- Bundled web runtime is now an Xcode folder reference (`www`) so `Bundle.main/.../www/index.html` and nested Vite assets keep their paths.
- Removed the hard-coded llama device-header search path; framework discovery uses the XCFramework dependency/search path.
- Pinned and verifies the official b10516 XCFramework SHA-256 before extraction.
- Preflight now checks web assets, bridging header, XCFramework device header, Swift mode, resource packaging and local-AI token lifetime.
- Fixed a dangling-token lifetime bug in the Objective-C++ generation loop (`llama_batch_get_one`).
- Local AI model loading retries CPU-only when Metal/offload model loading fails.
- Local AI decode/context failures return explicit native errors.
- iOS JS bridge clears timeout handles, gives local inference/update longer limits, and does not time out while the system file picker is open.
- File pickers present from the currently top-most view controller.
- Model storage is excluded from iCloud backup.
- CI unsigned iOS build uses deterministic DerivedData and verifies the resulting app really contains `www/index.html`, runtime metadata and embedded `llama.framework`.
- External URL handling rejects unsupported schemes instead of handing arbitrary URLs to UIApplication.

## Verification boundary
Static checks can validate Swift parsing, shell/YAML/project structure and release-tree invariants. The final device SDK compile/link/sign test still runs in the macOS GitHub Actions iOS job. That job now performs post-build bundle inspection so packaging failures are surfaced directly.
