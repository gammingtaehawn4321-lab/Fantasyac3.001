import Foundation
import CryptoKit

/// Keeps downloadable web/game content outside the signed native launcher bundle.
/// The active path never changes, so WKWebView storage keeps the same file origin across game patches.
final class GameContentManager: @unchecked Sendable {
    static let shared = GameContentManager()
    private static let maxArchiveBytes = 512 * 1024 * 1024
    private static let maxExtractedBytes = 1024 * 1024 * 1024
    private static let versionPattern = "^\\d+(?:\\.\\d+){2,3}$"

    private let fm = FileManager.default
    private let lock = NSLock()
    private var startupRecoveryChecked = false

    private init() {}

    private var root: URL { get throws { try fantasyacSupport().appendingPathComponent("GameRuntime", isDirectory: true) } }
    private var current: URL { get throws { try root.appendingPathComponent("current", isDirectory: true) } }
    private var previous: URL { get throws { try root.appendingPathComponent("previous", isDirectory: true) } }
    private var staging: URL { get throws { try root.appendingPathComponent("staging", isDirectory: true) } }
    private var stateURL: URL { get throws { try root.appendingPathComponent("state.json") } }

    func ensureInstalled() throws {
        lock.lock(); defer { lock.unlock() }
        try ensureInstalledUnlocked()
    }

    func currentIndexURL() throws -> URL {
        try ensureInstalled()
        return try current.appendingPathComponent("index.html")
    }

    func isAllowedFileURL(_ url: URL) -> Bool {
        guard url.isFileURL else { return false }
        do {
            let base = try current.standardizedFileURL.path
            let target = url.standardizedFileURL.path
            return target == base || target.hasPrefix(base + "/")
        } catch { return false }
    }

    func statusDictionary() -> [String: Any] {
        do {
            try ensureInstalled()
            let state = try readState()
            return [
                "available": true,
                "gameVersion": try readGameVersion(current),
                "launcherVersion": launcherVersion(),
                "source": state["source"] as? String ?? "UNKNOWN",
                "canSelfUpdate": true,
                "currentPath": try current.path,
                "pendingHealthCheck": state["pendingHealthCheck"] as? Bool ?? false,
                "hasPrevious": try isValidGameDir(previous),
            ]
        } catch {
            return [
                "available": false,
                "gameVersion": "",
                "launcherVersion": launcherVersion(),
                "source": "UNKNOWN",
                "canSelfUpdate": false,
                "error": error.localizedDescription,
            ]
        }
    }

    func apply(manifestJSON: String) async throws -> [String: Any] {
        guard let manifestData = manifestJSON.data(using: .utf8),
              let manifest = try JSONSerialization.jsonObject(with: manifestData) as? [String: Any],
              let gameVersion = manifest["gameVersion"] as? String,
              let minimumLauncherVersion = manifest["minimumLauncherVersion"] as? String,
              let bundle = manifest["bundle"] as? [String: Any],
              let rawURL = bundle["url"] as? String,
              let url = URL(string: rawURL), url.scheme == "https",
              let expectedSHA = bundle["sha256"] as? String,
              expectedSHA.range(of: "^[A-Fa-f0-9]{64}$", options: .regularExpression) != nil,
              let expectedSize = bundle["sizeBytes"] as? NSNumber,
              let format = bundle["format"] as? String else {
            throw runtimeError(100, "게임 업데이트 manifest가 올바르지 않습니다.")
        }
        guard (manifest["schemaVersion"] as? NSNumber)?.intValue == 1 else {
            throw runtimeError(100, "지원하지 않는 게임 업데이트 manifest 버전입니다.")
        }
        guard gameVersion.range(of: Self.versionPattern, options: .regularExpression) != nil,
              minimumLauncherVersion.range(of: Self.versionPattern, options: .regularExpression) != nil else {
            throw runtimeError(100, "게임 업데이트 버전 형식이 올바르지 않습니다.")
        }
        let expectedSizeValue = expectedSize.intValue
        guard expectedSizeValue > 0, expectedSizeValue <= Self.maxArchiveBytes else {
            throw runtimeError(100, "게임 패치 크기 정보가 허용 범위를 벗어났습니다.")
        }
        guard format == "ZIP_STORE_V1" else {
            throw runtimeError(100, "지원하지 않는 게임 패치 형식입니다: \(format)")
        }
        guard compareVersions(launcherVersion(), minimumLauncherVersion) >= 0 else {
            throw runtimeError(101, "런처 \(launcherVersion())가 요구 버전 \(minimumLauncherVersion)보다 오래되었습니다.")
        }
        try ensureInstalled()
        let installedVersion = try readGameVersion(current)
        guard compareVersions(gameVersion, installedVersion) > 0 else {
            throw runtimeError(101, "원격 게임 패치 \(gameVersion)은 현재 버전 \(installedVersion)보다 새 버전이 아닙니다.")
        }

        let (temporaryURL, response) = try await URLSession.shared.download(from: url)
        guard response.url?.scheme?.lowercased() == "https" else {
            throw runtimeError(102, "게임 패치가 HTTPS 외 주소로 리다이렉트되었습니다.")
        }
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw runtimeError(http.statusCode, "게임 패치 다운로드 실패: HTTP \(http.statusCode)")
        }
        if response.expectedContentLength > 0 {
            guard response.expectedContentLength == Int64(expectedSizeValue) else {
                throw runtimeError(102, "게임 패치 Content-Length가 manifest와 다릅니다.")
            }
        }
        let attrs = try fm.attributesOfItem(atPath: temporaryURL.path)
        let actualSize = (attrs[.size] as? NSNumber)?.intValue ?? 0
        guard actualSize == expectedSizeValue, actualSize <= Self.maxArchiveBytes else {
            throw runtimeError(102, "게임 패치 파일 크기가 manifest와 다릅니다.")
        }
        let archiveData = try Data(contentsOf: temporaryURL, options: .mappedIfSafe)
        let actualSHA = SHA256.hash(data: archiveData).map { String(format: "%02x", $0) }.joined()
        guard actualSHA.caseInsensitiveCompare(expectedSHA) == .orderedSame else {
            throw runtimeError(102, "게임 패치 SHA-256 검증에 실패했습니다.")
        }
        return try installArchive(
            archiveData,
            expectedGameVersion: gameVersion,
            expectedMinimumLauncher: minimumLauncherVersion
        )
    }

    func applyLocalArchive(at url: URL) throws -> [String: Any] {
        let accessing = url.startAccessingSecurityScopedResource()
        defer { if accessing { url.stopAccessingSecurityScopedResource() } }
        let attrs = try fm.attributesOfItem(atPath: url.path)
        let size = (attrs[.size] as? NSNumber)?.intValue ?? 0
        guard size > 0, size <= Self.maxArchiveBytes else {
            throw runtimeError(102, "게임 패치 ZIP 크기가 허용 범위를 벗어났습니다.")
        }
        let data = try Data(contentsOf: url, options: .mappedIfSafe)
        return try installArchive(data, expectedGameVersion: nil, expectedMinimumLauncher: nil)
    }

    private func installArchive(_ archiveData: Data, expectedGameVersion: String?, expectedMinimumLauncher: String?) throws -> [String: Any] {
        lock.lock(); defer { lock.unlock() }
        try ensureInstalledUnlocked()

        let stage = try staging
        try removeIfExists(stage)
        try fm.createDirectory(at: stage, withIntermediateDirectories: true)
        try StoredZipExtractor.extract(archiveData, to: stage)
        guard try isValidGameDir(stage) else { throw runtimeError(103, "게임 패치에 index.html 또는 game-runtime.json이 없습니다.") }

        let patchMetaURL = stage.appendingPathComponent("game-patch.json")
        guard fm.fileExists(atPath: patchMetaURL.path),
              let patchMeta = try JSONSerialization.jsonObject(with: Data(contentsOf: patchMetaURL)) as? [String: Any],
              let packageVersion = patchMeta["gameVersion"] as? String,
              let packageMinimumLauncher = patchMeta["minimumLauncherVersion"] as? String,
              let packageFormat = patchMeta["format"] as? String else {
            throw runtimeError(104, "game-patch.json이 없거나 올바르지 않습니다.")
        }
        guard packageVersion.range(of: Self.versionPattern, options: .regularExpression) != nil,
              packageMinimumLauncher.range(of: Self.versionPattern, options: .regularExpression) != nil else {
            throw runtimeError(104, "게임 패치 버전 형식이 올바르지 않습니다.")
        }
        guard packageFormat == "ZIP_STORE_V1" else {
            throw runtimeError(104, "지원하지 않는 게임 패치 형식입니다: \(packageFormat)")
        }
        let runtimeVersion = try readGameVersion(stage)
        guard packageVersion == runtimeVersion else { throw runtimeError(105, "패치 메타데이터와 게임 런타임 버전이 다릅니다.") }
        if let expectedGameVersion, packageVersion != expectedGameVersion {
            throw runtimeError(106, "manifest 버전 \(expectedGameVersion)과 패키지 버전 \(packageVersion)이 다릅니다.")
        }
        if let expectedMinimumLauncher, packageMinimumLauncher != expectedMinimumLauncher {
            throw runtimeError(107, "최소 런처 버전 정보가 manifest와 패키지에서 다릅니다.")
        }
        guard compareVersions(launcherVersion(), packageMinimumLauncher) >= 0 else {
            throw runtimeError(108, "런처 \(launcherVersion())가 요구 버전 \(packageMinimumLauncher)보다 오래되었습니다.")
        }

        let active = try current
        let old = try previous
        let oldVersion = try readGameVersion(active)
        if expectedGameVersion != nil, compareVersions(packageVersion, oldVersion) <= 0 {
            throw runtimeError(108, "원격 게임 패치 \(packageVersion)은 현재 버전 \(oldVersion)보다 새 버전이 아닙니다.")
        }
        try removeIfExists(old)
        if fm.fileExists(atPath: active.path) { try fm.moveItem(at: active, to: old) }
        do {
            // Record rollback intent before the staged bundle becomes active. If the process
            // dies after this point, the next launch can reliably restore `previous`.
            try writeState(gameVersion: packageVersion, source: "DOWNLOADED", pendingHealthCheck: true)
            try fm.moveItem(at: stage, to: active)
        } catch {
            try? removeIfExists(active)
            if fm.fileExists(atPath: old.path) { try? fm.moveItem(at: old, to: active) }
            try? writeState(gameVersion: oldVersion, source: "RECOVERED", pendingHealthCheck: false)
            throw error
        }
        return ["ok": true, "gameVersion": packageVersion, "previousGameVersion": oldVersion]
    }

    func rollback() throws -> [String: Any] {
        lock.lock(); defer { lock.unlock() }
        startupRecoveryChecked = true
        try ensureInstalledUnlocked()
        return try rollbackUnlocked()
    }

    func confirmHealthy() throws {
        lock.lock(); defer { lock.unlock() }
        try ensureInstalledUnlocked()
        let state = try readState()
        try writeState(
            gameVersion: try readGameVersion(current),
            source: state["source"] as? String ?? "UNKNOWN",
            pendingHealthCheck: false
        )
    }

    private func recoverInterruptedRollbackUnlocked(active: URL, old: URL) throws {
        let swap = try root.appendingPathComponent("rollback_swap", isDirectory: true)
        guard fm.fileExists(atPath: swap.path) else { return }
        let swapValid = try isValidGameDir(swap)
        let activeValid = try isValidGameDir(active)
        let oldValid = try isValidGameDir(old)
        if swapValid && !activeValid && oldValid {
            // Crash after current -> swap, before previous -> current: cancel the rollback.
            try removeIfExists(active)
            try fm.moveItem(at: swap, to: active)
        } else if swapValid && activeValid && !oldValid {
            // Crash after previous -> current: finish the rollback.
            try removeIfExists(old)
            try fm.moveItem(at: swap, to: old)
            try writeState(gameVersion: try readGameVersion(active), source: "RECOVERED", pendingHealthCheck: false)
        } else {
            try removeIfExists(swap)
        }
    }

    private func recoverPendingFailureUnlocked(active: URL, old: URL) throws {
        guard try isValidGameDir(old) else { throw runtimeError(109, "정상 이전 게임 패치가 없습니다.") }
        try removeIfExists(active)
        try fm.moveItem(at: old, to: active)
        try writeState(gameVersion: try readGameVersion(active), source: "RECOVERED", pendingHealthCheck: false)
    }

    private func rollbackUnlocked() throws -> [String: Any] {
        let active = try current
        let old = try previous
        guard try isValidGameDir(old) else { throw runtimeError(110, "이전 게임 패치가 없습니다.") }
        let activeVersion = try readGameVersion(active)
        let oldVersion = try readGameVersion(old)
        let swap = try root.appendingPathComponent("rollback_swap", isDirectory: true)
        try removeIfExists(swap)
        try fm.moveItem(at: active, to: swap)
        do {
            try fm.moveItem(at: old, to: active)
            try fm.moveItem(at: swap, to: old)
        } catch {
            if !fm.fileExists(atPath: active.path), fm.fileExists(atPath: swap.path) { try? fm.moveItem(at: swap, to: active) }
            throw error
        }
        try writeState(gameVersion: oldVersion, source: "RECOVERED", pendingHealthCheck: false)
        return ["ok": true, "rolledBack": true, "gameVersion": oldVersion, "previousGameVersion": activeVersion]
    }

    private func ensureInstalledUnlocked() throws {
        let base = try root
        try fm.createDirectory(at: base, withIntermediateDirectories: true)
        let active = try current
        let old = try previous
        if !startupRecoveryChecked {
            startupRecoveryChecked = true
            try recoverInterruptedRollbackUnlocked(active: active, old: old)
            let state = try readState()
            if (state["pendingHealthCheck"] as? Bool ?? false), try isValidGameDir(active), try isValidGameDir(old) {
                try recoverPendingFailureUnlocked(active: active, old: old)
            }
        }
        if !(try isValidGameDir(active)), try isValidGameDir(old) {
            try removeIfExists(active)
            try fm.moveItem(at: old, to: active)
            try writeState(gameVersion: try readGameVersion(active), source: "RECOVERED")
        }

        if try isValidGameDir(active) {
            let bundledVersion = try readBundledGameVersion()
            if bundledVersion != "0", compareVersions(bundledVersion, try readGameVersion(active)) > 0 {
                try installBundledUpgrade(active: active, old: old)
            }
            return
        }

        try installBundledFresh(active: active)
    }

    private func bundledWWWURL() throws -> URL {
        guard let bundledIndex = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") else {
            throw runtimeError(120, "번들 게임 파일을 찾을 수 없습니다.")
        }
        return bundledIndex.deletingLastPathComponent()
    }

    private func readBundledGameVersion() throws -> String {
        guard let bundleURL = try? bundledWWWURL(), let version = try? readGameVersion(bundleURL) else { return "0" }
        return version
    }

    private func installBundledFresh(active: URL) throws {
        let stage = try staging
        try removeIfExists(stage)
        try fm.copyItem(at: bundledWWWURL(), to: stage)
        guard try isValidGameDir(stage) else { throw runtimeError(121, "번들 게임 파일이 불완전합니다.") }
        try removeIfExists(active)
        try fm.moveItem(at: stage, to: active)
        try writeState(gameVersion: try readGameVersion(active), source: "BUNDLED")
    }

    private func installBundledUpgrade(active: URL, old: URL) throws {
        let stage = try staging
        try removeIfExists(stage)
        try fm.copyItem(at: bundledWWWURL(), to: stage)
        guard try isValidGameDir(stage) else { throw runtimeError(121, "번들 게임 파일이 불완전합니다.") }
        try removeIfExists(old)
        let oldVersion = try readGameVersion(active)
        let newVersion = try readGameVersion(stage)
        try fm.moveItem(at: active, to: old)
        do {
            // Treat an APK/IPA-bundled web runtime upgrade like a downloaded patch: if the
            // new web bundle cannot reach its health confirmation, restore the previous one.
            try writeState(gameVersion: newVersion, source: "BUNDLED", pendingHealthCheck: true)
            try fm.moveItem(at: stage, to: active)
        } catch {
            try? removeIfExists(active)
            if fm.fileExists(atPath: old.path) { try? fm.moveItem(at: old, to: active) }
            try? writeState(gameVersion: oldVersion, source: "RECOVERED", pendingHealthCheck: false)
            throw error
        }
    }

    private func fantasyacSupport() throws -> URL {
        let base = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let dir = base.appendingPathComponent("Fantasyac", isDirectory: true)
        try fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private func launcherVersion() -> String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
    }

    private func readGameVersion(_ directory: URL) throws -> String {
        let metadata = directory.appendingPathComponent("game-runtime.json")
        guard fm.fileExists(atPath: metadata.path) else { return "0" }
        let data = try Data(contentsOf: metadata)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let version = (object?["gameVersion"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "0"
        return version.range(of: Self.versionPattern, options: .regularExpression) != nil ? version : "0"
    }

    private func isValidGameDir(_ directory: URL) throws -> Bool {
        guard fm.fileExists(atPath: directory.appendingPathComponent("index.html").path) else { return false }
        // Corrupt runtime metadata should be treated as an invalid bundle so startup can
        // recover `previous` or the signed bundled copy instead of making the app unbootable.
        guard let version = try? readGameVersion(directory) else { return false }
        return version != "0"
    }

    private func readState() throws -> [String: Any] {
        let url = try stateURL
        guard fm.fileExists(atPath: url.path) else { return [:] }
        do {
            return (try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any]) ?? [:]
        } catch {
            // state.json is only recovery metadata. A corrupt/torn state file must never
            // make the entire game runtime unbootable; the runtime directories are revalidated below.
            try? fm.removeItem(at: url)
            return [:]
        }
    }

    private func writeState(gameVersion: String, source: String, pendingHealthCheck: Bool = false) throws {
        let data = try JSONSerialization.data(withJSONObject: [
            "gameVersion": gameVersion,
            "source": source,
            "pendingHealthCheck": pendingHealthCheck,
            "updatedAt": Date().timeIntervalSince1970,
        ], options: [.prettyPrinted, .sortedKeys])
        try data.write(to: stateURL, options: .atomic)
    }

    private func removeIfExists(_ url: URL) throws {
        if fm.fileExists(atPath: url.path) { try fm.removeItem(at: url) }
    }

    private func compareVersions(_ a: String, _ b: String) -> Int {
        let split: (String) -> [Int] = { value in
            value.replacingOccurrences(of: "^v", with: "", options: .regularExpression)
                .components(separatedBy: CharacterSet(charactersIn: ".-"))
                .map { Int($0) ?? 0 }
        }
        let pa = split(a), pb = split(b)
        for i in 0..<max(pa.count, pb.count) {
            let av = i < pa.count ? pa[i] : 0
            let bv = i < pb.count ? pb[i] : 0
            if av != bv { return av > bv ? 1 : -1 }
        }
        return 0
    }

    private func runtimeError(_ code: Int, _ message: String) -> NSError {
        NSError(domain: "FantasyacGameRuntime", code: code, userInfo: [NSLocalizedDescriptionKey: message])
    }
}

/// Minimal ZIP reader intentionally restricted to the release pipeline's ZIP_STORE_V1 format.
/// Whole-archive SHA-256 is verified before this runs.
private enum StoredZipExtractor {
    private static let maxEntries = 50_000
    private static let maxExtractedBytes = 1024 * 1024 * 1024
    private static let versionPattern = "^\\d+(?:\\.\\d+){2,3}$"

    static func extract(_ data: Data, to destination: URL) throws {
        guard data.count > 0, data.count <= 512 * 1024 * 1024 else { throw zipError(199, "ZIP 크기가 허용 범위를 벗어났습니다.") }
        guard containsEOCD(data) else { throw zipError(200, "ZIP 중앙 디렉터리 종료 레코드가 없습니다.") }

        var offset = 0
        var entryCount = 0
        var extractedBytes = 0
        var reachedCentralDirectory = false
        let fm = FileManager.default
        let base = destination.standardizedFileURL.path
        var seen = Set<String>()

        while offset + 4 <= data.count {
            let signature = u32(data, offset)
            if signature == 0x02014b50 || signature == 0x06054b50 {
                reachedCentralDirectory = true
                break
            }
            guard signature == 0x04034b50 else { throw zipError(201, "지원하지 않는 ZIP 구조입니다.") }
            guard offset + 30 <= data.count else { throw zipError(202, "손상된 ZIP 헤더입니다.") }
            entryCount += 1
            guard entryCount <= maxEntries else { throw zipError(203, "ZIP 엔트리가 너무 많습니다.") }

            let flags = u16(data, offset + 6)
            let method = u16(data, offset + 8)
            let expectedCRC = u32(data, offset + 14)
            let compressedSize = Int(u32(data, offset + 18))
            let uncompressedSize = Int(u32(data, offset + 22))
            let nameLength = Int(u16(data, offset + 26))
            let extraLength = Int(u16(data, offset + 28))
            guard flags & 0x0001 == 0 else { throw zipError(204, "암호화 ZIP은 허용되지 않습니다.") }
            guard flags & 0x0008 == 0 else { throw zipError(205, "data descriptor ZIP은 허용되지 않습니다.") }
            guard method == 0 else { throw zipError(206, "이 런처는 ZIP_STORE_V1 패치만 허용합니다.") }
            guard compressedSize == uncompressedSize else { throw zipError(207, "저장형 ZIP 크기 정보가 올바르지 않습니다.") }

            let nameStart = offset + 30
            let nameEnd = nameStart + nameLength
            let bodyStart = nameEnd + extraLength
            let bodyEnd = bodyStart + compressedSize
            guard nameEnd <= data.count, bodyEnd <= data.count else { throw zipError(208, "손상된 ZIP 엔트리입니다.") }
            guard let rawName = String(data: data.subdata(in: nameStart..<nameEnd), encoding: .utf8), !rawName.isEmpty, !rawName.contains("\0") else {
                throw zipError(209, "ZIP 파일명이 올바른 UTF-8이 아닙니다.")
            }
            let name = rawName.replacingOccurrences(of: "\\", with: "/")
            let parts = name.split(separator: "/", omittingEmptySubsequences: false)
            guard !name.hasPrefix("/"), !parts.contains(where: { $0 == ".." }) else { throw zipError(210, "ZIP 경로가 패치 영역을 벗어납니다.") }
            let output = destination.appendingPathComponent(name).standardizedFileURL
            guard output.path == base || output.path.hasPrefix(base + "/") else { throw zipError(211, "ZIP 경로가 패치 영역을 벗어납니다.") }
            guard seen.insert(output.path).inserted else { throw zipError(212, "중복 ZIP 경로가 있습니다: \(name)") }

            extractedBytes += uncompressedSize
            guard extractedBytes <= maxExtractedBytes else { throw zipError(213, "압축 해제된 게임 패치가 너무 큽니다.") }

            let body = data.subdata(in: bodyStart..<bodyEnd)
            guard crc32(body) == expectedCRC else { throw zipError(214, "ZIP 엔트리 CRC 검증에 실패했습니다: \(name)") }

            if name.hasSuffix("/") {
                guard uncompressedSize == 0 else { throw zipError(216, "ZIP 디렉터리 엔트리에 데이터가 포함되어 있습니다: \(name)") }
                try fm.createDirectory(at: output, withIntermediateDirectories: true)
            } else {
                try fm.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
                try body.write(to: output, options: .atomic)
            }
            offset = bodyEnd
        }
        guard entryCount > 0, reachedCentralDirectory else { throw zipError(215, "완전한 ZIP 중앙 디렉터리를 찾지 못했습니다.") }
    }

    private static func containsEOCD(_ data: Data) -> Bool {
        guard data.count >= 22 else { return false }
        let lower = max(0, data.count - 65_557)
        var i = data.count - 22
        while i >= lower {
            if u32(data, i) == 0x06054b50 { return true }
            if i == 0 { break }
            i -= 1
        }
        return false
    }

    private static func crc32(_ data: Data) -> UInt32 {
        var crc: UInt32 = 0xFFFF_FFFF
        for byte in data {
            crc ^= UInt32(byte)
            for _ in 0..<8 {
                let mask = UInt32(bitPattern: -Int32(crc & 1))
                crc = (crc >> 1) ^ (0xEDB8_8320 & mask)
            }
        }
        return crc ^ 0xFFFF_FFFF
    }

    private static func u16(_ data: Data, _ offset: Int) -> UInt16 {
        UInt16(data[offset]) | (UInt16(data[offset + 1]) << 8)
    }

    private static func u32(_ data: Data, _ offset: Int) -> UInt32 {
        UInt32(data[offset]) |
        (UInt32(data[offset + 1]) << 8) |
        (UInt32(data[offset + 2]) << 16) |
        (UInt32(data[offset + 3]) << 24)
    }

    private static func zipError(_ code: Int, _ message: String) -> NSError {
        NSError(domain: "FantasyacStoredZip", code: code, userInfo: [NSLocalizedDescriptionKey: message])
    }
}
