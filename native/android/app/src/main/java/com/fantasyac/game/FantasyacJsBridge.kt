package com.fantasyac.game

import android.app.Activity
import android.webkit.JavascriptInterface
import org.json.JSONObject
import java.io.File

class FantasyacJsBridge(
    private val activity: Activity,
    private val localAI: LocalAIEngine,
    private val models: ModelManager,
    private val geminiKeyStore: SecureGeminiKeyStore,
    private val geminiClient: GeminiNativeClient,
    private val gameContent: GameContentManager,
) {
    @JavascriptInterface
    fun getLocalAIStatus(): String = localAI.statusJson()

    @JavascriptInterface
    fun listLocalModels(): String = models.listJson()

    @JavascriptInterface
    fun startModelDownload(modelId: String, url: String, fileName: String): String = models.startDownload(modelId, url, fileName)

    @JavascriptInterface
    fun getModelDownloadStatus(jobId: String): String = models.downloadStatusJson(jobId)

    @JavascriptInterface
    fun importLocalModel(): String {
        val main = activity as? MainActivity ?: return JSONObject().put("ok", false).put("error", "MainActivity unavailable").toString()
        main.runOnUiThread { main.requestModelImport() }
        return JSONObject().put("ok", true).toString()
    }

    @JavascriptInterface
    fun activateLocalModel(modelId: String, presetId: String): String = try {
        val ok = models.activate(modelId, presetId = presetId)
        if (ok) localAI.unload()
        JSONObject().put("ok", ok).put("error", if (ok) JSONObject.NULL else "모델 파일을 찾을 수 없습니다.").toString()
    } catch (t: Throwable) { JSONObject().put("ok", false).put("error", t.message ?: "모델 활성화 실패").toString() }

    @JavascriptInterface
    fun deleteLocalModel(modelId: String): String = try {
        localAI.unload()
        JSONObject().put("ok", models.delete(modelId)).toString()
    } catch (t: Throwable) { JSONObject().put("ok", false).put("error", t.message ?: "모델 삭제 실패").toString() }

    @JavascriptInterface
    fun fetchRemoteText(url: String): String {
        val parsed = java.net.URL(url)
        require(parsed.protocol == "https") { "HTTPS URL만 허용됩니다." }
        val conn = parsed.openConnection() as java.net.HttpURLConnection
        conn.instanceFollowRedirects = true
        conn.connectTimeout = 15_000
        conn.readTimeout = 20_000
        conn.setRequestProperty("User-Agent", "Fantasyac/3.3")
        conn.setRequestProperty("Accept", "application/json, text/plain;q=0.9, */*;q=0.1")
        try {
            conn.connect()
            require(conn.url.protocol.equals("https", ignoreCase = true)) { "HTTPS 외 리다이렉트는 허용되지 않습니다." }
            if (conn.responseCode !in 200..299) throw IllegalStateException("HTTP ${conn.responseCode}")
            val maxBytes = 1024L * 1024L
            val declared = conn.contentLengthLong
            if (declared > maxBytes) throw IllegalStateException("원격 텍스트 응답이 너무 큽니다.")
            val output = java.io.ByteArrayOutputStream()
            conn.inputStream.use { input ->
                val buffer = ByteArray(16 * 1024)
                var total = 0L
                while (true) {
                    val read = input.read(buffer)
                    if (read < 0) break
                    if (read == 0) continue
                    total += read.toLong()
                    if (total > maxBytes) throw IllegalStateException("원격 텍스트 응답이 너무 큽니다.")
                    output.write(buffer, 0, read)
                }
            }
            return output.toString(Charsets.UTF_8.name())
        } finally {
            conn.disconnect()
        }
    }

    @JavascriptInterface
    fun getGeminiKeyStatus(): String = JSONObject()
        .put("configured", geminiKeyStore.hasKey())
        .put("provider", "ANDROID_KEYSTORE")
        .toString()

    @JavascriptInterface
    fun setGeminiApiKey(apiKey: String): String = try {
        geminiKeyStore.set(apiKey)
        JSONObject().put("ok", true).toString()
    } catch (t: Throwable) {
        JSONObject().put("ok", false).put("error", t.message ?: "key save failed").toString()
    }

    @JavascriptInterface
    fun clearGeminiApiKey() = geminiKeyStore.clear()

    @JavascriptInterface
    fun generateGeminiInterpretation(requestJson: String): String = geminiClient.generate(requestJson)

    @JavascriptInterface
    fun generateLocalNarration(requestJson: String): String = localAI.generate(requestJson)

    @JavascriptInterface
    fun cancelLocalNarration() = localAI.cancel()

    @JavascriptInterface
    fun getAppDataPath(): String = activity.filesDir.absolutePath

    @JavascriptInterface
    fun getGameContentStatus(): String = gameContent.statusJson()

    @JavascriptInterface
    fun applyGameContentUpdate(manifestJson: String): String = gameContent.applyUpdate(manifestJson)

    @JavascriptInterface
    fun importGameContentUpdate(): String {
        val main = activity as? MainActivity ?: return JSONObject().put("ok", false).put("error", "MainActivity unavailable").toString()
        main.runOnUiThread { main.requestGamePatchImport() }
        return JSONObject().put("ok", true).put("pending", true).toString()
    }

    @JavascriptInterface
    fun reloadGameContent() {
        (activity as? MainActivity)?.loadGameContent()
    }

    @JavascriptInterface
    fun rollbackGameContent(): String = gameContent.rollback()

    @JavascriptInterface
    fun confirmGameContentHealthy() = gameContent.confirmHealthy()


    @JavascriptInterface
    fun saveUpdateBackup(json: String, suggestedName: String): String {
        return try {
            val dir = File(activity.filesDir, "backups").apply { mkdirs() }
            val safe = suggestedName.replace(Regex("[^A-Za-z0-9._-]"), "_")
            val file = File(dir, safe.ifBlank { "fantasyac_backup.json" })
            val temp = File(dir, ".${file.name}.${System.nanoTime()}.tmp")
            java.io.FileOutputStream(temp).use { output ->
                output.write(json.toByteArray(Charsets.UTF_8))
                output.fd.sync()
            }
            try {
                java.nio.file.Files.move(
                    temp.toPath(), file.toPath(),
                    java.nio.file.StandardCopyOption.ATOMIC_MOVE,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING,
                )
            } catch (_: java.nio.file.AtomicMoveNotSupportedException) {
                java.nio.file.Files.move(temp.toPath(), file.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING)
            } finally {
                temp.delete()
            }
            JSONObject().put("ok", true).put("path", file.absolutePath).toString()
        } catch (t: Throwable) {
            JSONObject().put("ok", false).put("error", t.message ?: "backup failed").toString()
        }
    }

    @JavascriptInterface
    fun openExternalUrl(url: String) {
        val main = activity as? MainActivity ?: return
        activity.runOnUiThread { main.openExternalHttpUrl(url) }
    }
}
