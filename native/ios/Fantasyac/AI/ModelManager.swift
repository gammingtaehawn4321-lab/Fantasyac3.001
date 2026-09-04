import Foundation

actor ModelManager {
    static let shared = ModelManager()

    struct DownloadJob {
        var jobId: String
        var modelId: String
        var state: String = "QUEUED"
        var bytesDownloaded: Int64 = 0
        var totalBytes: Int64 = 0
        var error: String?
    }

    private static let minGGUFBytes: Int64 = 32 * 1024 * 1024
    private static let maxGGUFBytes: Int64 = 8 * 1024 * 1024 * 1024
    private static let ggufMagic = Data([0x47, 0x47, 0x55, 0x46]) // "GGUF"

    private var jobs: [String: DownloadJob] = [:]
    private let defaults = UserDefaults.standard

    func modelsDirectory() throws -> URL {
        let base = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let dir = base.appendingPathComponent("Fantasyac/Models", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        var protectedDir = dir
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? protectedDir.setResourceValues(values)
        return dir
    }

    func activeModelId() -> String? { defaults.string(forKey: "fantasyac.activeModelId") }
    func activePresetId() -> String { defaults.string(forKey: "fantasyac.localAIPreset") ?? "BALANCED" }

    func listDictionary() throws -> [String: Any] {
        let dir = try modelsDirectory()
        let active = activeModelId()
        let urls = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey], options: [.skipsHiddenFiles])
            .filter {
                let values = try? $0.resourceValues(forKeys: [.isRegularFileKey])
                return values?.isRegularFile == true && $0.pathExtension.lowercased() == "gguf"
            }
            .sorted { $0.lastPathComponent.localizedCaseInsensitiveCompare($1.lastPathComponent) == .orderedAscending }
        let models: [[String: Any]] = urls.map { url in
            let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize).map(Int64.init) ?? 0
            let id = modelId(for: url)
            return ["id": id, "fileName": url.lastPathComponent, "sizeBytes": size, "active": id == active]
        }
        return ["models": models, "activeModelId": active ?? NSNull()]
    }

    func startDownload(modelId: String, urlString: String, fileName: String) throws -> String {
        guard let url = URL(string: urlString), url.scheme?.lowercased() == "https" else {
            throw modelError(1, "모델은 HTTPS 주소에서만 다운로드할 수 있습니다.")
        }
        guard fileName.lowercased().hasSuffix(".gguf") else {
            throw modelError(1, "GGUF 파일만 다운로드할 수 있습니다.")
        }
        let jobId = UUID().uuidString
        jobs[jobId] = DownloadJob(jobId: jobId, modelId: modelId)
        Task { await self.runDownload(jobId: jobId, modelId: modelId, url: url, fileName: fileName) }
        return jobId
    }

    func status(jobId: String) -> [String: Any] {
        guard let j = jobs[jobId] else { return ["jobId": jobId, "state": "FAILED", "bytesDownloaded": 0, "error": "download job not found"] }
        return ["jobId": j.jobId, "modelId": j.modelId, "state": j.state, "bytesDownloaded": j.bytesDownloaded, "totalBytes": j.totalBytes, "error": j.error ?? NSNull()]
    }

    private func runDownload(jobId: String, modelId: String, url: URL, fileName: String) async {
        do {
            jobs[jobId]?.state = "DOWNLOADING"
            let (temporary, response) = try await URLSession.shared.download(from: url)
            guard response.url?.scheme?.lowercased() == "https" else { throw modelError(2, "HTTPS 외 리다이렉트는 허용되지 않습니다.") }
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                throw modelError((response as? HTTPURLResponse)?.statusCode ?? 2, "모델 다운로드 HTTP 오류")
            }
            let expected = response.expectedContentLength
            if expected > 0 {
                guard expected >= Self.minGGUFBytes, expected <= Self.maxGGUFBytes else { throw modelError(2, "모델 파일 크기가 허용 범위를 벗어났습니다.") }
            }
            let attrs = try FileManager.default.attributesOfItem(atPath: temporary.path)
            let actual = (attrs[.size] as? NSNumber)?.int64Value ?? 0
            jobs[jobId]?.bytesDownloaded = actual
            jobs[jobId]?.totalBytes = expected > 0 ? expected : actual
            try validateGGUF(at: temporary, size: actual)

            let dir = try modelsDirectory()
            let name = sanitize(fileName)
            let target = try uniqueTarget(in: dir, fileName: name)
            try FileManager.default.moveItem(at: temporary, to: target)
            jobs[jobId]?.state = "COMPLETED"
            if activeModelId() == nil { _ = try activate(modelId: self.modelId(for: target), presetId: "BALANCED") }
        } catch {
            jobs[jobId]?.state = "FAILED"
            jobs[jobId]?.error = error.localizedDescription
        }
    }

    func importModel(from source: URL) throws -> [String: Any] {
        let accessing = source.startAccessingSecurityScopedResource()
        defer { if accessing { source.stopAccessingSecurityScopedResource() } }
        let dir = try modelsDirectory()
        let base = sanitize(source.lastPathComponent.lowercased().hasSuffix(".gguf") ? source.lastPathComponent : "imported-\(Int(Date().timeIntervalSince1970)).gguf")
        let target = try uniqueTarget(in: dir, fileName: base)
        let temp = dir.appendingPathComponent(".\(target.lastPathComponent).\(UUID().uuidString).part")
        do {
            let size = try copyFileWithLimit(from: source, to: temp)
            try validateGGUF(at: temp, size: size)
            try FileManager.default.moveItem(at: temp, to: target)
        } catch {
            try? FileManager.default.removeItem(at: temp)
            try? FileManager.default.removeItem(at: target)
            throw error
        }
        let id = modelId(for: target)
        if activeModelId() == nil { _ = try activate(modelId: id, presetId: "BALANCED") }
        return ["ok": true, "modelId": id, "fileName": target.lastPathComponent]
    }

    func activate(modelId: String, presetId: String) throws -> Bool {
        guard let file = try findFile(modelId: modelId) else { return false }
        try validateGGUF(at: file)
        defaults.set(modelId, forKey: "fantasyac.activeModelId")
        defaults.set(presetId, forKey: "fantasyac.localAIPreset")
        return true
    }

    func delete(modelId: String) throws -> Bool {
        guard let file = try findFile(modelId: modelId) else { return false }
        if activeModelId() == modelId { defaults.removeObject(forKey: "fantasyac.activeModelId") }
        try FileManager.default.removeItem(at: file)
        return true
    }

    func activeModelFile() throws -> URL? {
        guard let id = activeModelId(), let file = try findFile(modelId: id) else { return nil }
        try validateGGUF(at: file)
        return file
    }

    private func findFile(modelId: String) throws -> URL? {
        let dir = try modelsDirectory()
        return try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.isRegularFileKey]).first {
            let values = try? $0.resourceValues(forKeys: [.isRegularFileKey])
            return values?.isRegularFile == true && $0.pathExtension.lowercased() == "gguf" && self.modelId(for: $0) == modelId
        }
    }

    private func validateGGUF(at url: URL, size suppliedSize: Int64? = nil) throws {
        let size: Int64
        if let suppliedSize {
            size = suppliedSize
        } else {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            size = (attributes[.size] as? NSNumber)?.int64Value ?? 0
        }
        guard size >= Self.minGGUFBytes, size <= Self.maxGGUFBytes else { throw modelError(3, "GGUF 파일 크기가 허용 범위를 벗어났습니다.") }
        let handle = try FileHandle(forReadingFrom: url)
        defer { try? handle.close() }
        let header = try handle.read(upToCount: 4) ?? Data()
        guard header == Self.ggufMagic else { throw modelError(4, "GGUF 파일 헤더가 올바르지 않습니다.") }
    }

    private func copyFileWithLimit(from source: URL, to target: URL) throws -> Int64 {
        guard FileManager.default.createFile(atPath: target.path, contents: nil) else {
            throw modelError(6, "모델 임시 파일을 만들 수 없습니다.")
        }
        let input = try FileHandle(forReadingFrom: source)
        let output = try FileHandle(forWritingTo: target)
        defer { try? input.close(); try? output.close() }
        var total: Int64 = 0
        while let chunk = try input.read(upToCount: 1024 * 1024), !chunk.isEmpty {
            total += Int64(chunk.count)
            guard total <= Self.maxGGUFBytes else { throw modelError(5, "모델 파일이 8 GiB 제한을 초과했습니다.") }
            try output.write(contentsOf: chunk)
        }
        try output.synchronize()
        guard total >= Self.minGGUFBytes else { throw modelError(3, "GGUF 파일이 비정상적으로 작습니다.") }
        return total
    }

    private func uniqueTarget(in dir: URL, fileName: String) throws -> URL {
        var target = dir.appendingPathComponent(fileName)
        var n = 2
        while FileManager.default.fileExists(atPath: target.path) {
            let stem = (fileName as NSString).deletingPathExtension
            target = dir.appendingPathComponent("\(stem)-\(n).gguf")
            n += 1
        }
        return target
    }

    private func modelId(for url: URL) -> String {
        url.deletingPathExtension().lastPathComponent.lowercased().replacingOccurrences(of: "[^a-z0-9._-]", with: "-", options: .regularExpression)
    }

    private func sanitize(_ value: String) -> String {
        let leaf = (value as NSString).lastPathComponent
        var safe = leaf.replacingOccurrences(of: "[^A-Za-z0-9._-]", with: "_", options: .regularExpression)
        if !safe.lowercased().hasSuffix(".gguf") { safe += ".gguf" }
        if safe.count > 180 { safe = String(safe.prefix(175)) + ".gguf" }
        return safe.isEmpty ? "model.gguf" : safe
    }

    private func modelError(_ code: Int, _ message: String) -> NSError {
        NSError(domain: "FantasyacModel", code: code, userInfo: [NSLocalizedDescriptionKey: message])
    }
}
