import Foundation

// Objective-C bridge objects are not annotated Sendable. We keep ownership in a small
// unchecked box only for the synchronous inference hop to a dedicated GCD worker.
// FantasyacLlamaBridge itself serializes generation at the actor level and uses an atomic
// cancellation flag, so this does not permit overlapping generation calls.
private final class FantasyacLlamaBridgeBox: @unchecked Sendable {
    let value: FantasyacLlamaBridge
    init(_ value: FantasyacLlamaBridge) { self.value = value }
}

actor LocalAIEngine {
    static let shared = LocalAIEngine()
    private var modelID: String?
    private var bridge: FantasyacLlamaBridge?
    private var inferenceInFlight = false
    private let models = ModelManager.shared

    func statusDictionary() async -> [String: Any] {
        let active = await models.activeModelId()
        return [
            "available": true,
            "loaded": bridge != nil && modelID == active,
            "busy": inferenceInFlight,
            "modelId": active ?? NSNull(),
            "detail": active == nil ? "로컬 모델이 설치되지 않았습니다." : (bridge != nil && modelID == active ? "iOS local narrator ready" : "모델 설치됨 · 첫 생성 시 로드됩니다.")
        ]
    }

    func generate(requestJson: String) async throws -> String {
        guard !inferenceInFlight else {
            throw NSError(domain: "FantasyacLocalAI", code: 1004, userInfo: [NSLocalizedDescriptionKey: "LOCAL_NARRATOR_BUSY"])
        }
        try await ensureActiveModelLoaded()
        guard let activeBridge = bridge else {
            throw NSError(domain: "FantasyacLocalAI", code: 1002, userInfo: [NSLocalizedDescriptionKey: "LOCAL_MODEL_NOT_LOADED"])
        }
        let preset = await models.activePresetId()
        let maxTokens: Int32 = preset == "QUALITY" ? 1600 : (preset == "BATTERY" ? 800 : 1200)
        inferenceInFlight = true
        defer { inferenceInFlight = false }

        // llama.cpp generation is synchronous. Run it outside the actor executor so cancel()
        // and status calls remain responsive while inference is in progress.
        let bridgeBox = FantasyacLlamaBridgeBox(activeBridge)
        let text: String = try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    let generated = try bridgeBox.value.generateRequestJSON(
                        requestJson,
                        maxTokens: maxTokens,
                        temperature: 0.72,
                        topP: 0.92
                    )
                    continuation.resume(returning: generated)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
        guard !text.isEmpty else {
            throw NSError(domain: "FantasyacLocalAI", code: 1003, userInfo: [NSLocalizedDescriptionKey: "Local narration failed"])
        }
        return text
    }

    func cancel() { bridge?.cancel() }

    func unload() {
        bridge?.cancel()
        bridge = nil
        modelID = nil
    }

    private func ensureActiveModelLoaded() async throws {
        let active = await models.activeModelId()
        guard let active else {
            throw NSError(domain: "FantasyacLocalAI", code: 1000, userInfo: [NSLocalizedDescriptionKey: "LOCAL_MODEL_NOT_INSTALLED"])
        }
        if bridge != nil && modelID == active { return }
        bridge = nil
        modelID = nil
        guard let model = try await models.activeModelFile() else {
            throw NSError(domain: "FantasyacLocalAI", code: 1000, userInfo: [NSLocalizedDescriptionKey: "LOCAL_MODEL_NOT_INSTALLED"])
        }
        let preset = await models.activePresetId()
        let contextSize: Int32 = preset == "QUALITY" ? 4096 : (preset == "BATTERY" ? 2048 : 3072)
        let native = try FantasyacLlamaBridge(modelPath: model.path, contextSize: contextSize)
        bridge = native
        modelID = active
    }
}
