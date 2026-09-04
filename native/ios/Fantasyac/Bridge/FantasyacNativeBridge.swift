import Foundation
import WebKit
import UIKit
import UniformTypeIdentifiers

final class FantasyacNativeBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    private let localAI = LocalAIEngine.shared
    private let gemini = GeminiNativeClient.shared
    private let models = ModelManager.shared
    private let gameContent = GameContentManager.shared
    private var modelPickerDelegate: DocumentPickerDelegate?
    private var gamePatchPickerDelegate: DocumentPickerDelegate?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "fantasyac",
              let body = message.body as? [String: Any],
              let id = body["id"] as? String,
              let name = body["name"] as? String else { return }
        let payload = body["payload"] as? [String: Any] ?? [:]

        Task {
            do {
                let result: Any
                switch name {
                case "getLocalAIStatus":
                    result = await localAI.statusDictionary()
                case "listLocalModels":
                    result = try await models.listDictionary()
                case "startModelDownload":
                    let modelId = payload["modelId"] as? String ?? "model"
                    let url = payload["url"] as? String ?? ""
                    let fileName = payload["fileName"] as? String ?? "model.gguf"
                    result = ["ok": true, "jobId": try await models.startDownload(modelId: modelId, urlString: url, fileName: fileName)]
                case "getModelDownloadStatus":
                    result = await models.status(jobId: payload["jobId"] as? String ?? "")
                case "importLocalModel":
                    let picked = try await pickModelURL()
                    result = try await models.importModel(from: picked)
                    await localAI.unload()
                case "activateLocalModel":
                    let ok = try await models.activate(modelId: payload["modelId"] as? String ?? "", presetId: payload["presetId"] as? String ?? "BALANCED")
                    await localAI.unload()
                    result = ["ok": ok]
                case "deleteLocalModel":
                    await localAI.unload()
                    result = ["ok": try await models.delete(modelId: payload["modelId"] as? String ?? "")]
                case "fetchRemoteText":
                    guard let raw = payload["url"] as? String, let url = URL(string: raw), url.scheme == "https" else {
                        throw NSError(domain: "FantasyacBridge", code: 30, userInfo: [NSLocalizedDescriptionKey: "HTTPS URL만 허용됩니다."])
                    }
                    var request = URLRequest(url: url)
                    request.timeoutInterval = 30
                    request.setValue("application/json, text/plain;q=0.9, */*;q=0.1", forHTTPHeaderField: "Accept")
                    request.setValue("Fantasyac/3.3", forHTTPHeaderField: "User-Agent")
                    let (data, response) = try await URLSession.shared.data(for: request)
                    guard response.url?.scheme?.lowercased() == "https" else {
                        throw NSError(domain: "FantasyacBridge", code: 31, userInfo: [NSLocalizedDescriptionKey: "HTTPS 외 리다이렉트는 허용되지 않습니다."])
                    }
                    if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                        throw NSError(domain: "FantasyacBridge", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode)"])
                    }
                    guard data.count <= 1024 * 1024 else {
                        throw NSError(domain: "FantasyacBridge", code: 32, userInfo: [NSLocalizedDescriptionKey: "원격 텍스트 응답이 너무 큽니다."])
                    }
                    result = ["text": String(data: data, encoding: .utf8) ?? ""]
                case "getGeminiKeyStatus":
                    result = ["configured": SecureGeminiKeyStore.shared.hasKey(), "provider": "IOS_KEYCHAIN"]
                case "setGeminiApiKey":
                    try SecureGeminiKeyStore.shared.set(payload["apiKey"] as? String ?? "")
                    result = ["ok": true]
                case "clearGeminiApiKey":
                    SecureGeminiKeyStore.shared.clear(); result = NSNull()
                case "generateGeminiInterpretation":
                    let request = payload["requestJson"] as? String ?? "{}"
                    result = ["text": try await gemini.generate(requestJson: request)]
                case "generateLocalNarration":
                    let request = payload["requestJson"] as? String ?? "{}"
                    result = ["text": try await localAI.generate(requestJson: request)]
                case "cancelLocalNarration":
                    await localAI.cancel(); result = NSNull()
                case "saveUpdateBackup":
                    let json = payload["json"] as? String ?? "{}"
                    let suggested = payload["suggestedName"] as? String ?? "fantasyac_backup.json"
                    result = try saveBackup(json: json, suggestedName: suggested)
                case "openExternalUrl":
                    guard let raw = payload["url"] as? String,
                          let url = URL(string: raw),
                          let scheme = url.scheme?.lowercased(),
                          ["https", "http"].contains(scheme) else {
                        throw NSError(domain: "FantasyacBridge", code: 33, userInfo: [NSLocalizedDescriptionKey: "지원하지 않는 외부 URL입니다."])
                    }
                    await MainActor.run { UIApplication.shared.open(url) }
                    result = NSNull()
                case "getAppDataPath":
                    result = try applicationSupportDirectory().path
                case "getGameContentStatus":
                    result = gameContent.statusDictionary()
                case "applyGameContentUpdate":
                    let manifestJSON = payload["manifestJson"] as? String ?? "{}"
                    result = try await gameContent.apply(manifestJSON: manifestJSON)
                case "importGameContentUpdate":
                    let picked = try await pickGamePatchURL()
                    result = try gameContent.applyLocalArchive(at: picked)
                case "reloadGameContent":
                    try await reloadGameContent()
                    result = NSNull()
                case "rollbackGameContent":
                    result = try gameContent.rollback()
                case "confirmGameContentHealthy":
                    try gameContent.confirmHealthy()
                    result = NSNull()
                default:
                    throw NSError(domain: "FantasyacBridge", code: 404, userInfo: [NSLocalizedDescriptionKey: "Unknown bridge method: \(name)"])
                }
                resolve(id: id, ok: true, payload: result)
            } catch {
                resolve(id: id, ok: false, payload: error.localizedDescription)
            }
        }
    }

    private func applicationSupportDirectory() throws -> URL {
        let base = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        let dir = base.appendingPathComponent("Fantasyac", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private func saveBackup(json: String, suggestedName: String) throws -> [String: Any] {
        let dir = try applicationSupportDirectory().appendingPathComponent("Backups", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "._-"))
        let leaf = (suggestedName as NSString).lastPathComponent
        let sanitized = String(leaf.unicodeScalars.map { allowed.contains($0) ? Character(String($0)) : "_" })
        let trimmed = sanitized.isEmpty ? "fantasyac_backup.json" : String(sanitized.prefix(160))
        let safeName = trimmed.lowercased().hasSuffix(".json") ? trimmed : "\(trimmed).json"
        let url = dir.appendingPathComponent(safeName, isDirectory: false)
        try json.write(to: url, atomically: true, encoding: .utf8)
        return ["ok": true, "path": url.path]
    }

    @MainActor
    private func currentPresenter() -> UIViewController? {
        var current = webView?.window?.rootViewController
        while true {
            if let presented = current?.presentedViewController { current = presented; continue }
            if let navigation = current as? UINavigationController { current = navigation.visibleViewController; continue }
            if let tabs = current as? UITabBarController { current = tabs.selectedViewController; continue }
            break
        }
        return current
    }

    @MainActor
    private func pickModelURL() async throws -> URL {
        guard let presenter = currentPresenter() else {
            throw NSError(domain: "FantasyacModel", code: 20, userInfo: [NSLocalizedDescriptionKey: "파일 선택기를 열 수 없습니다."])
        }
        return try await withCheckedThrowingContinuation { continuation in
            let gguf = UTType(filenameExtension: "gguf") ?? .data
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [gguf, .data], asCopy: true)
            let delegate = DocumentPickerDelegate(cancelMessage: "모델 가져오기를 취소했습니다.") { [weak self] result in
                self?.modelPickerDelegate = nil
                continuation.resume(with: result)
            }
            modelPickerDelegate = delegate
            picker.delegate = delegate
            picker.allowsMultipleSelection = false
            presenter.present(picker, animated: true)
        }
    }



    @MainActor
    private func pickGamePatchURL() async throws -> URL {
        guard let presenter = currentPresenter() else {
            throw NSError(domain: "FantasyacGameRuntime", code: 140, userInfo: [NSLocalizedDescriptionKey: "파일 선택기를 열 수 없습니다."])
        }
        return try await withCheckedThrowingContinuation { continuation in
            let zip = UTType.zip
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [zip, .data], asCopy: true)
            let delegate = DocumentPickerDelegate(cancelMessage: "게임 패치 가져오기를 취소했습니다.") { [weak self] result in
                self?.gamePatchPickerDelegate = nil
                continuation.resume(with: result)
            }
            gamePatchPickerDelegate = delegate
            picker.delegate = delegate
            picker.allowsMultipleSelection = false
            presenter.present(picker, animated: true)
        }
    }

    @MainActor
    private func reloadGameContent() async throws {
        guard let webView else { throw NSError(domain: "FantasyacGameRuntime", code: 130, userInfo: [NSLocalizedDescriptionKey: "WebView가 준비되지 않았습니다."]) }
        let index = try gameContent.currentIndexURL()
        webView.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
    }

    private func resolve(id: String, ok: Bool, payload: Any) {
        guard let webView else { return }
        let payloadData = (try? JSONSerialization.data(withJSONObject: ["payload": payload], options: [])) ?? Data("{\"payload\":null}".utf8)
        let object = (try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any]) ?? ["payload": NSNull()]
        let data = try? JSONSerialization.data(withJSONObject: object["payload"] ?? NSNull(), options: [.fragmentsAllowed])
        let json = data.flatMap { String(data: $0, encoding: .utf8) } ?? "null"
        let escapedId = id.replacingOccurrences(of: "'", with: "\\'")
        let js = "window.__fantasyacNativeResolve && window.__fantasyacNativeResolve('\(escapedId)', \(ok ? "true" : "false"), \(json));"
        DispatchQueue.main.async { webView.evaluateJavaScript(js) }
    }
}


private final class DocumentPickerDelegate: NSObject, UIDocumentPickerDelegate {
    let cancelMessage: String
    private let completion: (Result<URL, Error>) -> Void
    private var completed = false

    init(cancelMessage: String, completion: @escaping (Result<URL, Error>) -> Void) {
        self.cancelMessage = cancelMessage
        self.completion = completion
    }

    private func finish(_ result: Result<URL, Error>) {
        guard !completed else { return }
        completed = true
        completion(result)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else {
            finish(.failure(NSError(domain: "FantasyacDocumentPicker", code: 21, userInfo: [NSLocalizedDescriptionKey: "파일을 선택하지 않았습니다."])))
            return
        }
        finish(.success(url))
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish(.failure(NSError(domain: "FantasyacDocumentPicker", code: 22, userInfo: [NSLocalizedDescriptionKey: cancelMessage])))
    }
}
