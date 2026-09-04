package com.fantasyac.game

import android.content.Context
import org.json.JSONObject

class LocalAIEngine(private val context: Context, private val models: ModelManager) : AutoCloseable {
    companion object { init { System.loadLibrary("fantasyac_llama") } }

    private var handle: Long = 0L
    private var loadedModelId: String? = null

    fun statusJson(): String {
        val active = models.activeModelId()
        return JSONObject()
            .put("available", nativeRuntimeAvailable())
            .put("loaded", handle != 0L && loadedModelId == active)
            .put("modelId", active ?: JSONObject.NULL)
            .put("detail", when {
                active == null -> "로컬 모델이 설치되지 않았습니다."
                handle != 0L && loadedModelId == active -> "Android NDK local narrator ready"
                else -> "모델 설치됨 · 첫 생성 시 로드됩니다."
            }).toString()
    }

    @Synchronized
    private fun ensureActiveModelLoaded(): Boolean {
        val activeId = models.activeModelId() ?: return false
        if (handle != 0L && loadedModelId == activeId) return true
        if (handle != 0L) { nativeFree(handle); handle = 0L; loadedModelId = null }
        val model = models.activeModelFile() ?: return false
        val preset = models.activePresetId()
        val contextSize = when (preset) { "QUALITY" -> 4096; "BATTERY" -> 2048; else -> 3072 }
        val threads = when (preset) { "BATTERY" -> 3; else -> 4 }
        handle = nativeLoadModel(model.absolutePath, contextSize, threads)
        if (handle != 0L) loadedModelId = activeId
        return handle != 0L
    }

    fun generate(requestJson: String): String {
        if (!ensureActiveModelLoaded()) return JSONObject().put("error", "LOCAL_MODEL_NOT_INSTALLED").toString()
        val preset = models.activePresetId()
        val maxTokens = when (preset) { "QUALITY" -> 1600; "BATTERY" -> 800; else -> 1200 }
        val text = nativeGenerate(handle, requestJson, maxTokens, 0.72f, 0.92f)
        return JSONObject().put("text", text).put("provider", "LOCAL").toString()
    }

    @Synchronized
    fun unload() { if (handle != 0L) nativeFree(handle); handle = 0L; loadedModelId = null }
    fun cancel() { if (handle != 0L) nativeCancel(handle) }
    override fun close() = unload()

    private external fun nativeRuntimeAvailable(): Boolean
    private external fun nativeLoadModel(path: String, contextSize: Int, threads: Int): Long
    private external fun nativeGenerate(handle: Long, requestJson: String, maxTokens: Int, temperature: Float, topP: Float): String
    private external fun nativeCancel(handle: Long)
    private external fun nativeFree(handle: Long)
}
