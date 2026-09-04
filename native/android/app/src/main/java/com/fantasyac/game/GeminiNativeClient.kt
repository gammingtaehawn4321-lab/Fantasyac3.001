package com.fantasyac.game

import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

class GeminiNativeClient(private val keyStore: SecureGeminiKeyStore) {
    companion object {
        private const val MAX_REQUEST_BYTES = 4 * 1024 * 1024
        private const val MAX_RESPONSE_BYTES = 8 * 1024 * 1024
    }
    private val models = listOf("gemini-3.6-flash")

    fun generate(requestJson: String): String {
        require(requestJson.toByteArray(Charsets.UTF_8).size <= MAX_REQUEST_BYTES) { "Gemini request is too large." }
        val key = keyStore.get() ?: throw IllegalStateException("GEMINI_API_KEY_NOT_CONFIGURED")
        val req = JSONObject(requestJson)
        var lastError: Throwable? = null
        for (model in models) {
            try { return callModel(key, model, req) }
            catch (t: Throwable) { lastError = t }
        }
        throw lastError ?: IllegalStateException("Gemini request failed")
    }

    private fun callModel(apiKey: String, model: String, req: JSONObject): String {
        val endpoint = URL("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent")
        val connection = (endpoint.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 30_000
            readTimeout = 120_000
            doOutput = true
            instanceFollowRedirects = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("x-goog-api-key", apiKey)
        }

        try {
            val contents = JSONArray()
            val inputContents = req.optJSONArray("contents") ?: JSONArray()
            for (i in 0 until inputContents.length()) {
                val c = inputContents.getJSONObject(i)
                contents.put(JSONObject()
                    .put("role", if (c.optString("role") == "model") "model" else "user")
                    .put("parts", JSONArray().put(JSONObject().put("text", c.optString("text")))))
            }
            val generationConfig = JSONObject()
                .put("temperature", req.optDouble("temperature", 0.45))
                .put("topP", req.optDouble("topP", 0.9))
                .put("responseMimeType", req.optString("responseMimeType", "application/json"))
            val body = JSONObject()
                .put("systemInstruction", JSONObject().put("parts", JSONArray().put(JSONObject().put("text", req.optString("systemInstruction")))))
                .put("contents", contents)
                .put("generationConfig", generationConfig)
            val bodyBytes = body.toString().toByteArray(Charsets.UTF_8)
            require(bodyBytes.size <= MAX_REQUEST_BYTES) { "Gemini request is too large." }

            connection.outputStream.use { it.write(bodyBytes) }
            val status = connection.responseCode
            require(connection.url.protocol.equals("https", ignoreCase = true)) { "Gemini request redirected to a non-HTTPS URL." }
            val declared = connection.contentLengthLong
            if (declared > MAX_RESPONSE_BYTES) throw IllegalStateException("Gemini response is too large.")
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val responseText = if (stream != null) readLimited(stream, MAX_RESPONSE_BYTES) else ""
            if (status !in 200..299) throw IllegalStateException("Gemini HTTP $status: ${responseText.take(500)}")
            if (responseText.isBlank()) throw IllegalStateException("Gemini returned an empty HTTP response")

            val json = JSONObject(responseText)
            val candidates = json.optJSONArray("candidates") ?: throw IllegalStateException("Gemini response has no candidates")
            if (candidates.length() == 0) throw IllegalStateException("Gemini response was empty")
            val parts = candidates.getJSONObject(0).getJSONObject("content").getJSONArray("parts")
            val text = buildString {
                for (i in 0 until parts.length()) append(parts.getJSONObject(i).optString("text"))
            }.trim()
            if (text.isBlank()) throw IllegalStateException("Gemini response text was empty")
            return text
        } finally {
            connection.disconnect()
        }
    }

    private fun readLimited(input: InputStream, limit: Int): String {
        input.use { stream ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(32 * 1024)
            var total = 0
            while (true) {
                val read = stream.read(buffer)
                if (read < 0) break
                if (read == 0) continue
                total += read
                if (total > limit) throw IllegalStateException("Gemini response is too large.")
                output.write(buffer, 0, read)
            }
            return output.toString(Charsets.UTF_8.name())
        }
    }
}
