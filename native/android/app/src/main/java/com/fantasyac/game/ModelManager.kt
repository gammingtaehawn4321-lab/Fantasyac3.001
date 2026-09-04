package com.fantasyac.game

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.concurrent.thread

data class ModelDownloadJob(
    val jobId: String,
    val modelId: String,
    val fileName: String,
    @Volatile var state: String = "QUEUED",
    @Volatile var bytesDownloaded: Long = 0,
    @Volatile var totalBytes: Long = 0,
    @Volatile var error: String? = null,
)

class ModelManager(private val context: Context) {
    companion object {
        private const val MIN_GGUF_BYTES = 32L * 1024L * 1024L
        private const val MAX_GGUF_BYTES = 8L * 1024L * 1024L * 1024L
        private val GGUF_MAGIC = byteArrayOf(0x47, 0x47, 0x55, 0x46) // "GGUF"
    }

    private val modelsDir = File(context.filesDir, "models").apply { mkdirs() }
    private val prefs = context.getSharedPreferences("fantasyac_local_ai", Context.MODE_PRIVATE)
    private val jobs = ConcurrentHashMap<String, ModelDownloadJob>()

    fun modelsDirectory(): File = modelsDir
    fun activeModelId(): String? = prefs.getString("activeModelId", null)
    fun activePresetId(): String = prefs.getString("presetId", "BALANCED") ?: "BALANCED"

    fun listJson(): String {
        val active = activeModelId()
        val models = JSONArray()
        modelsDir.listFiles { f -> f.isFile && f.extension.equals("gguf", true) }
            ?.sortedBy { it.name.lowercase() }
            ?.forEach { file ->
                val id = idForFile(file)
                models.put(JSONObject()
                    .put("id", id)
                    .put("fileName", file.name)
                    .put("sizeBytes", file.length())
                    .put("active", id == active))
            }
        return JSONObject().put("models", models).put("activeModelId", active ?: JSONObject.NULL).toString()
    }

    fun startDownload(modelId: String, url: String, fileName: String): String {
        val parsed = try { URL(url) } catch (_: Throwable) { null }
            ?: return JSONObject().put("ok", false).put("error", "잘못된 모델 URL입니다.").toString()
        if (!parsed.protocol.equals("https", ignoreCase = true)) {
            return JSONObject().put("ok", false).put("error", "모델은 HTTPS 주소에서만 다운로드할 수 있습니다.").toString()
        }
        if (!fileName.lowercase().endsWith(".gguf")) {
            return JSONObject().put("ok", false).put("error", "GGUF 파일만 다운로드할 수 있습니다.").toString()
        }

        val jobId = UUID.randomUUID().toString()
        val safeName = sanitizeFileName(fileName)
        val job = ModelDownloadJob(jobId, modelId, safeName)
        jobs[jobId] = job
        thread(name = "fantasyac-model-download", isDaemon = true) {
            var conn: HttpURLConnection? = null
            val partial = File(modelsDir, ".$safeName.$jobId.part")
            try {
                job.state = "DOWNLOADING"
                conn = parsed.openConnection() as HttpURLConnection
                conn.instanceFollowRedirects = true
                conn.connectTimeout = 20_000
                conn.readTimeout = 120_000
                conn.setRequestProperty("User-Agent", "Fantasyac/3.3")
                conn.connect()
                require(conn.url.protocol.equals("https", ignoreCase = true)) { "HTTPS 외 리다이렉트는 허용되지 않습니다." }
                require(conn.responseCode in 200..299) { "HTTP ${conn.responseCode}" }
                val declared = conn.contentLengthLong
                if (declared > 0) {
                    require(declared in MIN_GGUF_BYTES..MAX_GGUF_BYTES) { "모델 파일 크기가 허용 범위를 벗어났습니다." }
                    job.totalBytes = declared
                }
                conn.inputStream.use { input ->
                    FileOutputStream(partial).use { output ->
                        copyWithLimit(input, output, job)
                        output.fd.sync()
                    }
                }
                verifyGGUF(partial)
                val target = synchronized(this) { uniqueTarget(safeName) }
                moveAtomically(partial, target)
                job.state = "COMPLETED"
                if (activeModelId() == null) activate(idForFile(target), target.name, "BALANCED")
            } catch (t: Throwable) {
                job.state = "FAILED"
                job.error = t.message ?: "download failed"
                partial.delete()
            } finally {
                conn?.disconnect()
            }
        }
        return JSONObject().put("ok", true).put("jobId", jobId).toString()
    }

    fun downloadStatusJson(jobId: String): String {
        val job = jobs[jobId] ?: return JSONObject()
            .put("jobId", jobId).put("state", "FAILED").put("bytesDownloaded", 0).put("error", "download job not found").toString()
        return JSONObject()
            .put("jobId", job.jobId)
            .put("modelId", job.modelId)
            .put("state", job.state)
            .put("bytesDownloaded", job.bytesDownloaded)
            .put("totalBytes", job.totalBytes)
            .put("error", job.error ?: JSONObject.NULL)
            .toString()
    }

    fun activate(modelId: String, fileName: String? = null, presetId: String): Boolean {
        val file = when {
            fileName != null -> File(modelsDir, sanitizeFileName(fileName))
            else -> findFileForModelId(modelId)
        } ?: return false
        if (!file.isFile || !file.extension.equals("gguf", true)) return false
        verifyGGUF(file)
        prefs.edit().putString("activeModelId", idForFile(file)).putString("presetId", presetId).apply()
        return true
    }

    fun delete(modelId: String): Boolean {
        val file = findFileForModelId(modelId) ?: return false
        if (idForFile(file) == activeModelId()) prefs.edit().remove("activeModelId").apply()
        return file.delete()
    }

    fun importFile(source: InputStream, displayName: String?): File {
        val base = sanitizeFileName(displayName?.takeIf { it.lowercase().endsWith(".gguf") }
            ?: "imported-${System.currentTimeMillis()}.gguf")
        val target = synchronized(this) { uniqueTarget(base) }
        val temp = File(modelsDir, ".${target.name}.${UUID.randomUUID()}.part")
        try {
            FileOutputStream(temp).use { output ->
                copyWithLimit(source, output, null)
                output.fd.sync()
            }
            verifyGGUF(temp)
            moveAtomically(temp, target)
        } catch (t: Throwable) {
            temp.delete()
            target.delete()
            throw t
        }
        if (activeModelId() == null) activate(idForFile(target), target.name, "BALANCED")
        return target
    }

    fun activeModelFile(): File? = activeModelId()?.let { findFileForModelId(it) }

    private fun copyWithLimit(input: InputStream, output: FileOutputStream, job: ModelDownloadJob?): Long {
        val buf = ByteArray(1024 * 1024)
        var total = 0L
        while (true) {
            val read = input.read(buf)
            if (read < 0) break
            if (read == 0) continue
            total += read.toLong()
            require(total <= MAX_GGUF_BYTES) { "모델 파일이 8 GiB 제한을 초과했습니다." }
            output.write(buf, 0, read)
            job?.bytesDownloaded = total
        }
        require(total >= MIN_GGUF_BYTES) { "GGUF 파일이 비정상적으로 작습니다." }
        return total
    }

    private fun verifyGGUF(file: File) {
        require(file.isFile && file.length() in MIN_GGUF_BYTES..MAX_GGUF_BYTES) { "GGUF 파일 크기가 허용 범위를 벗어났습니다." }
        val header = ByteArray(4)
        FileInputStream(file).use { input -> require(input.read(header) == 4) { "GGUF 헤더를 읽을 수 없습니다." } }
        require(header.contentEquals(GGUF_MAGIC)) { "GGUF 파일 헤더가 올바르지 않습니다." }
    }

    private fun findFileForModelId(modelId: String): File? = modelsDir.listFiles()
        ?.firstOrNull { it.isFile && it.extension.equals("gguf", true) && idForFile(it) == modelId }
    private fun idForFile(file: File): String = file.name.removeSuffix(".gguf").lowercase().replace(Regex("[^a-z0-9._-]"), "-")
    private fun sanitizeFileName(name: String): String = name.substringAfterLast('/').substringAfterLast('\\')
        .replace(Regex("[^A-Za-z0-9._-]"), "_")
        .let { if (it.lowercase().endsWith(".gguf")) it else "$it.gguf" }
        .take(180)
        .ifBlank { "model.gguf" }

    private fun uniqueTarget(name: String): File {
        var target = File(modelsDir, name)
        var n = 2
        while (target.exists()) {
            target = File(modelsDir, name.removeSuffix(".gguf") + "-$n.gguf")
            n++
        }
        return target
    }

    private fun moveAtomically(from: File, to: File) {
        try {
            Files.move(from.toPath(), to.toPath(), StandardCopyOption.ATOMIC_MOVE)
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(from.toPath(), to.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }
}
