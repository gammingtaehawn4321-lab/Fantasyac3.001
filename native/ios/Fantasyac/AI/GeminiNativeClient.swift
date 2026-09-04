import Foundation

actor GeminiNativeClient {
    static let shared = GeminiNativeClient()
    private let models = ["gemini-3.6-flash"]
    private let maxRequestBytes = 4 * 1024 * 1024
    private let maxResponseBytes = 8 * 1024 * 1024

    func generate(requestJson: String) async throws -> String {
        guard let apiKey = SecureGeminiKeyStore.shared.get(), !apiKey.isEmpty else {
            throw NSError(domain: "FantasyacGemini", code: 401, userInfo: [NSLocalizedDescriptionKey: "GEMINI_API_KEY_NOT_CONFIGURED"])
        }
        guard let raw = requestJson.data(using: .utf8), raw.count <= maxRequestBytes,
              let req = try JSONSerialization.jsonObject(with: raw) as? [String: Any] else {
            throw NSError(domain: "FantasyacGemini", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid interpreter request"])
        }
        var lastError: Error?
        for model in models {
            do { return try await callModel(apiKey: apiKey, model: model, request: req) }
            catch { lastError = error }
        }
        throw lastError ?? NSError(domain: "FantasyacGemini", code: 500)
    }

    private func callModel(apiKey: String, model: String, request: [String: Any]) async throws -> String {
        guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent") else {
            throw NSError(domain: "FantasyacGemini", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid Gemini endpoint"])
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.timeoutInterval = 120
        urlRequest.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue(apiKey, forHTTPHeaderField: "x-goog-api-key")

        let input = request["contents"] as? [[String: Any]] ?? []
        let contents: [[String: Any]] = input.map { item in
            [
                "role": (item["role"] as? String) == "model" ? "model" : "user",
                "parts": [["text": item["text"] as? String ?? ""]],
            ]
        }
        let body: [String: Any] = [
            "systemInstruction": ["parts": [["text": request["systemInstruction"] as? String ?? ""]]],
            "contents": contents,
            "generationConfig": [
                "temperature": request["temperature"] as? Double ?? 0.45,
                "topP": request["topP"] as? Double ?? 0.9,
                "responseMimeType": request["responseMimeType"] as? String ?? "application/json",
            ],
        ]
        let requestData = try JSONSerialization.data(withJSONObject: body)
        guard requestData.count <= maxRequestBytes else {
            throw NSError(domain: "FantasyacGemini", code: 413, userInfo: [NSLocalizedDescriptionKey: "Gemini request is too large"])
        }
        urlRequest.httpBody = requestData
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        guard response.url?.scheme?.lowercased() == "https" else {
            throw NSError(domain: "FantasyacGemini", code: 400, userInfo: [NSLocalizedDescriptionKey: "Gemini request redirected to a non-HTTPS URL"])
        }
        if response.expectedContentLength > Int64(maxResponseBytes) || data.count > maxResponseBytes {
            throw NSError(domain: "FantasyacGemini", code: 413, userInfo: [NSLocalizedDescriptionKey: "Gemini response is too large"])
        }
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            let message = String(data: data, encoding: .utf8) ?? ""
            throw NSError(domain: "FantasyacGemini", code: (response as? HTTPURLResponse)?.statusCode ?? 500, userInfo: [NSLocalizedDescriptionKey: message.prefix(500).description])
        }
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]], let first = candidates.first,
              let content = first["content"] as? [String: Any], let parts = content["parts"] as? [[String: Any]] else {
            throw NSError(domain: "FantasyacGemini", code: 502, userInfo: [NSLocalizedDescriptionKey: "Gemini response has no candidates"])
        }
        let text = parts.compactMap { $0["text"] as? String }.joined().trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw NSError(domain: "FantasyacGemini", code: 503, userInfo: [NSLocalizedDescriptionKey: "Gemini response text was empty"]) }
        return text
    }
}
