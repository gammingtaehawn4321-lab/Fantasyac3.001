# iOS deep audit final hardening

Validated against the current Fantasyac 3.3.2 / 7.1 native tree.

Key hardening in this pass:
- Retains the Xcode 26 Swift `rethrows` fix in `ModelManager.validateGGUF`: throwing file metadata lookup is no longer evaluated inside `??` autoclosure.
- Explicit iOS supported platforms / deployment target / Swift 5 compatibility mode (`iOS 16.4`, `SWIFT_VERSION 5.0`, strict concurrency minimal).
- Foundation-only native managers were checked under Swift complete-concurrency mode; Keychain and game-runtime singleton wrappers now declare deliberate `@unchecked Sendable` compatibility where appropriate.
- Synchronous llama.cpp generation runs on a dedicated GCD worker while the Swift actor remains responsive to cancel/status calls; concurrent generation is rejected.
- iOS llama.cpp bridge guards decoder-only models, Metal load failure (CPU retry), chat-template buffer sizing, prompt/token limits, context exhaustion, token-piece buffers, cancellation, and generated UTF-8.
- Removed the 1024-token first-decode batch cap; `n_batch` follows the selected local context size.
- Fixed next-token lifetime so `llama_batch_get_one` never points at a temporary stack token that has gone out of scope.
- Model import checks temporary-file creation and GGUF magic/size before activation.
- Document picker continuations are single-resume guarded; imported model/game-patch URLs use security-scoped access.
- WKWebView external URL opening hops to MainActor.
- Game content runtime remains rollback-safe and path-constrained.
- Signing preflight validates imported identity, provisioning profile team/app id and expiration, and uses current Xcode export-method names.
- Validate/release workflows retain full Xcode build logs, print condensed compiler failures, and upload diagnostics artifacts.
- Validate inspects generated build settings, compiles an unsigned generic iOS device app, inspects the built app bundle/framework architecture, and additionally compiles a simulator target when the pinned XCFramework exposes a simulator slice.
- iOS preflight checks the pinned XCFramework slices and every llama.cpp C API used by the Objective-C++ bridge before Xcode compilation, plus regression guards for the Xcode 26/Swift concurrency hardening.

Local verification performed in the packaging environment:
- all iOS Swift files: `swiftc -parse` PASS (Swift 6.2.1 parser)
- `ModelManager`, `LocalAIEngine`, `GeminiNativeClient`, `GameContentManager`: Swift 5 complete-concurrency semantic typecheck PASS using Linux platform shims where Apple-only frameworks are unavailable
- all iOS shell scripts: `bash -n` PASS
- all GitHub workflow YAML files: parse PASS
- release tree audit: PASS
- risky source patterns (`try!`, `as!`, `fatalError`, forced URL unwraps, old dangling-token pattern): none found in iOS runtime sources

The authoritative UIKit/WebKit/Objective-C++/Apple-SDK compile check is the macOS GitHub Actions `ios-source` job. The packaging host is Linux and cannot run Xcode itself; the workflow now captures the exact remaining compiler diagnostics if Apple SDK compilation still finds anything.
