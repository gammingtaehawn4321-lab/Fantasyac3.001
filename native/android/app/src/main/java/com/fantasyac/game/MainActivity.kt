package com.fantasyac.game

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var localAI: LocalAIEngine
    private lateinit var modelManager: ModelManager
    private lateinit var geminiKeyStore: SecureGeminiKeyStore
    private lateinit var geminiClient: GeminiNativeClient
    private lateinit var gameContent: GameContentManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        modelManager = ModelManager(this)
        localAI = LocalAIEngine(this, modelManager)
        geminiKeyStore = SecureGeminiKeyStore(this)
        geminiClient = GeminiNativeClient(geminiKeyStore)
        gameContent = GameContentManager(this)
        webView = WebView(this)
        setContentView(webView)

        WebView.setWebContentsDebuggingEnabled((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            allowContentAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
        }
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return true
                // Keep the JS bridge attached only to the managed game runtime.
                if (uri.scheme.equals("file", ignoreCase = true) && gameContent.isAllowedNavigationFile(uri.path)) return false
                if (uri.scheme.equals("https", true) || uri.scheme.equals("http", true)) openExternalHttpUrl(uri.toString())
                return true
            }
        }
        webView.addJavascriptInterface(FantasyacJsBridge(this, localAI, modelManager, geminiKeyStore, geminiClient, gameContent), "AndroidFantasyac")
        loadGameContent()
    }

    fun loadGameContent() {
        runOnUiThread {
            try {
                gameContent.ensureInstalled()
                val index = gameContent.currentIndexFile()
                webView.loadUrl(index.toURI().toString())
            } catch (t: Throwable) {
                showRuntimeError(t.message ?: "게임 런타임을 준비할 수 없습니다.")
            }
        }
    }

    private fun showRuntimeError(message: String) {
        val escaped = android.text.TextUtils.htmlEncode(message)
        webView.loadDataWithBaseURL(
            null,
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><h2>Fantasyac game runtime unavailable.</h2><pre>$escaped</pre>",
            "text/html",
            "utf-8",
            null,
        )
    }

    fun openExternalHttpUrl(raw: String): Boolean {
        val uri = try { Uri.parse(raw) } catch (_: Throwable) { return false }
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme != "https" && scheme != "http") return false
        return try {
            val intent = Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)
            if (intent.resolveActivity(packageManager) == null) false else { startActivity(intent); true }
        } catch (_: Throwable) { false }
    }

    private val gamePatchImportLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) { notifyGamePatchImported(false, null, "게임 패치 가져오기를 취소했습니다."); return@registerForActivityResult }
        try {
            val result = contentResolver.openInputStream(uri)?.use { input -> gameContent.applyLocalUpdate(input) }
                ?: "{\"ok\":false,\"error\":\"파일을 열 수 없습니다.\"}"
            val json = JSONObject(result)
            notifyGamePatchImported(json.optBoolean("ok", false), json.optString("gameVersion", ""), json.optString("error", ""))
        } catch (t: Throwable) {
            notifyGamePatchImported(false, null, t.message ?: "게임 패치 가져오기 실패")
        }
    }

    fun requestGamePatchImport() { gamePatchImportLauncher.launch(arrayOf("application/zip", "application/octet-stream", "*/*")) }

    private fun notifyGamePatchImported(ok: Boolean, gameVersion: String?, error: String?) {
        val detail = JSONObject().put("ok", ok).put("gameVersion", gameVersion ?: JSONObject.NULL).put("error", error ?: JSONObject.NULL).toString()
        runOnUiThread {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('fantasyac-game-patch-imported',{detail:$detail}));", null)
        }
    }

    private val modelImportLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@registerForActivityResult
        try {
            val name = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            }
            val imported = contentResolver.openInputStream(uri)?.use { input -> modelManager.importFile(input, name) }
                ?: throw IllegalStateException("모델 파일을 열 수 없습니다.")
            localAI.unload()
            notifyModelsChanged(true, null, imported.name)
        } catch (t: Throwable) {
            notifyModelsChanged(false, t.message ?: "모델 가져오기 실패", null)
        }
    }

    fun requestModelImport() { modelImportLauncher.launch(arrayOf("application/octet-stream", "*/*")) }

    private fun notifyModelsChanged(ok: Boolean, error: String?, fileName: String?) {
        val detail = JSONObject()
            .put("ok", ok)
            .put("error", error ?: JSONObject.NULL)
            .put("fileName", fileName ?: JSONObject.NULL)
            .toString()
        runOnUiThread {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('fantasyac-models-changed',{detail:$detail}));", null)
        }
    }

    override fun onDestroy() {
        localAI.close()
        webView.removeJavascriptInterface("AndroidFantasyac")
        webView.destroy()
        super.onDestroy()
    }
}
