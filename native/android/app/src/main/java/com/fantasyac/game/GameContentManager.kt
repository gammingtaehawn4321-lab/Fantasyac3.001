package com.fantasyac.game

import android.content.Context
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

/**
 * Keeps the frequently-updated web game separate from the rarely-updated APK/native launcher.
 *
 * filesDir/game_runtime/current  -> active game bundle (stable path = stable WebView storage origin)
 * filesDir/game_runtime/previous -> one-step rollback
 * filesDir/game_runtime/staging  -> verified update before atomic swap
 *
 * Models, backups, secure Gemini keys and Android native code live outside this directory.
 */
class GameContentManager(private val context: Context) {
    companion object {
        private const val MAX_ARCHIVE_BYTES = 512L * 1024L * 1024L
        private const val MAX_EXTRACTED_BYTES = 1024L * 1024L * 1024L
        private const val MAX_ZIP_ENTRIES = 50_000
        private val VERSION_RE = Regex("^\\d+(?:\\.\\d+){2,3}$")
    }
    private val root = File(context.filesDir, "game_runtime")
    private val current = File(root, "current")
    private val previous = File(root, "previous")
    private val staging = File(root, "staging")
    private val stateFile = File(root, "state.json")
    private var startupRecoveryChecked = false

    @Synchronized
    fun ensureInstalled() {
        root.mkdirs()
        if (!startupRecoveryChecked) {
            startupRecoveryChecked = true
            recoverInterruptedRollbackUnlocked()
            val state = readState()
            if (state.optBoolean("pendingHealthCheck", false) && isValidGameDir(current) && isValidGameDir(previous)) {
                recoverPendingFailureUnlocked()
            }
        }
        if (!isValidGameDir(current) && isValidGameDir(previous)) {
            current.deleteRecursively()
            moveDirectory(previous, current)
            writeState(readGameVersion(current), "RECOVERED")
        }

        if (isValidGameDir(current)) {
            val bundledVersion = readBundledGameVersion()
            if (bundledVersion != "0" && compareVersions(bundledVersion, readGameVersion(current)) > 0) {
                installBundledUpgrade()
            }
            return
        }

        installBundledFresh()
    }

    fun currentIndexFile(): File {
        ensureInstalled()
        return File(current, "index.html")
    }

    fun isAllowedNavigationFile(path: String?): Boolean {
        if (path.isNullOrBlank()) return false
        return try {
            val target = File(path).canonicalFile
            val base = current.canonicalFile
            target.path == base.path || target.path.startsWith(base.path + File.separator)
        } catch (_: Throwable) { false }
    }

    fun statusJson(): String {
        return try {
            ensureInstalled()
            val state = readState()
            JSONObject()
                .put("available", true)
                .put("gameVersion", readGameVersion(current))
                .put("launcherVersion", launcherVersion())
                .put("source", state.optString("source", "UNKNOWN"))
                .put("canSelfUpdate", true)
                .put("currentPath", current.absolutePath)
                .put("pendingHealthCheck", state.optBoolean("pendingHealthCheck", false))
                .put("hasPrevious", isValidGameDir(previous))
                .toString()
        } catch (t: Throwable) {
            JSONObject()
                .put("available", false)
                .put("gameVersion", "")
                .put("launcherVersion", launcherVersion())
                .put("source", "UNKNOWN")
                .put("canSelfUpdate", false)
                .put("error", t.message ?: "game runtime unavailable")
                .toString()
        }
    }

    @Synchronized
    fun applyUpdate(manifestJson: String): String {
        var downloaded: File? = null
        return try {
            ensureInstalled()
            val manifest = JSONObject(manifestJson)
            val gameVersion = manifest.getString("gameVersion").trim()
            val minimumLauncherVersion = manifest.getString("minimumLauncherVersion").trim()
            val bundle = manifest.getJSONObject("bundle")
            val url = bundle.getString("url").trim()
            val expectedSha = bundle.getString("sha256").trim().lowercase()
            val expectedSize = bundle.getLong("sizeBytes")
            val format = bundle.getString("format").trim()

            require(manifest.optInt("schemaVersion", 0) == 1) { "Unsupported game update manifest version." }
            require(gameVersion.matches(VERSION_RE)) { "Invalid gameVersion." }
            require(minimumLauncherVersion.matches(VERSION_RE)) { "Invalid minimumLauncherVersion." }
            require(URL(url).protocol.equals("https", ignoreCase = true)) { "Game bundle URL must use HTTPS." }
            require(expectedSha.matches(Regex("^[a-f0-9]{64}$"))) { "Valid SHA-256 is required." }
            require(expectedSize in 1L..MAX_ARCHIVE_BYTES) { "Game bundle size is outside the allowed range." }
            require(format == "ZIP_STORE_V1") { "Unsupported game bundle format: $format" }
            require(compareVersions(launcherVersion(), minimumLauncherVersion) >= 0) {
                "Launcher ${launcherVersion()} is older than required $minimumLauncherVersion."
            }
            require(compareVersions(gameVersion, readGameVersion(current)) > 0) {
                "Remote game update $gameVersion is not newer than the installed game ${readGameVersion(current)}."
            }

            downloaded = File(context.cacheDir, "fantasyac_game_update_${System.currentTimeMillis()}.zip")
            download(url, downloaded!!, expectedSize)
            require(downloaded!!.length() == expectedSize) { "Game bundle size mismatch." }
            val actualSha = sha256(downloaded!!)
            require(actualSha.equals(expectedSha, ignoreCase = true)) { "Game bundle SHA-256 mismatch." }
            installArchive(downloaded!!, expectedGameVersion = gameVersion, expectedMinimumLauncher = minimumLauncherVersion)
        } catch (t: Throwable) {
            staging.deleteRecursively()
            JSONObject().put("ok", false).put("error", t.message ?: "game update failed").toString()
        } finally {
            downloaded?.delete()
        }
    }

    @Synchronized
    fun applyLocalUpdate(input: java.io.InputStream): String {
        val local = File(context.cacheDir, "fantasyac_game_import_${System.currentTimeMillis()}.zip")
        return try {
            FileOutputStream(local).use { output -> copyWithLimit(input, output, MAX_ARCHIVE_BYTES) }
            ensureInstalled()
            installArchive(local, expectedGameVersion = null, expectedMinimumLauncher = null)
        } catch (t: Throwable) {
            staging.deleteRecursively()
            JSONObject().put("ok", false).put("error", t.message ?: "game patch import failed").toString()
        } finally {
            local.delete()
        }
    }

    private fun installArchive(zipFile: File, expectedGameVersion: String?, expectedMinimumLauncher: String?): String {
        staging.deleteRecursively()
        staging.mkdirs()
        unzipSafely(zipFile, staging)
        require(isValidGameDir(staging)) { "Game bundle is missing index.html or game-runtime.json." }

        val packageMetaFile = File(staging, "game-patch.json")
        require(packageMetaFile.isFile) { "game-patch.json is missing." }
        val packageMeta = JSONObject(packageMetaFile.readText(Charsets.UTF_8))
        val packageVersion = packageMeta.getString("gameVersion").trim()
        val packageMinimumLauncher = packageMeta.getString("minimumLauncherVersion").trim()
        val packageFormat = packageMeta.optString("format", "")
        require(packageVersion.matches(VERSION_RE)) { "Invalid package gameVersion." }
        require(packageMinimumLauncher.matches(VERSION_RE)) { "Invalid package minimumLauncherVersion." }
        require(packageFormat == "ZIP_STORE_V1") { "Unsupported game patch format: $packageFormat" }
        val runtimeVersion = readGameVersion(staging)
        require(packageVersion == runtimeVersion) { "Package metadata version $packageVersion does not match runtime $runtimeVersion." }
        if (!expectedGameVersion.isNullOrBlank()) require(packageVersion == expectedGameVersion) { "Manifest version $expectedGameVersion does not match package $packageVersion." }
        if (!expectedMinimumLauncher.isNullOrBlank()) require(packageMinimumLauncher == expectedMinimumLauncher) { "Minimum launcher version metadata mismatch." }
        require(compareVersions(launcherVersion(), packageMinimumLauncher) >= 0) {
            "Launcher ${launcherVersion()} is older than required $packageMinimumLauncher."
        }

        val oldVersion = readGameVersion(current)
        if (!expectedGameVersion.isNullOrBlank()) {
            require(compareVersions(packageVersion, oldVersion) > 0) {
                "Remote game update $packageVersion is not newer than installed game $oldVersion."
            }
        }
        previous.deleteRecursively()
        if (current.exists()) moveDirectory(current, previous)
        try {
            // Persist the rollback marker BEFORE the verified staging bundle becomes current.
            // A process death at any point after this can safely recover the previous bundle.
            writeState(packageVersion, "DOWNLOADED", pendingHealthCheck = true)
            moveDirectory(staging, current)
        } catch (swapError: Throwable) {
            current.deleteRecursively()
            if (previous.exists()) moveDirectory(previous, current)
            runCatching { writeState(oldVersion, "RECOVERED", pendingHealthCheck = false) }
            throw swapError
        }

        return JSONObject()
            .put("ok", true)
            .put("gameVersion", packageVersion)
            .put("previousGameVersion", oldVersion)
            .toString()
    }

    @Synchronized
    fun rollback(): String {
        return try {
            startupRecoveryChecked = true
            ensureInstalled()
            rollbackUnlocked().toString()
        } catch (t: Throwable) {
            JSONObject().put("ok", false).put("error", t.message ?: "rollback failed").toString()
        }
    }

    @Synchronized
    fun confirmHealthy() {
        ensureInstalled()
        val state = readState()
        writeState(readGameVersion(current), state.optString("source", "UNKNOWN"), pendingHealthCheck = false)
    }

    private fun recoverInterruptedRollbackUnlocked() {
        val swap = File(root, "rollback_swap")
        if (!swap.exists()) return
        val swapValid = isValidGameDir(swap)
        val currentValid = isValidGameDir(current)
        val previousValid = isValidGameDir(previous)
        when {
            swapValid && !currentValid && previousValid -> {
                // Crash after current -> swap, before previous -> current: cancel the rollback.
                current.deleteRecursively()
                moveDirectory(swap, current)
            }
            swapValid && currentValid && !previousValid -> {
                // Crash after previous -> current: finish the rollback by restoring old current as previous.
                previous.deleteRecursively()
                moveDirectory(swap, previous)
                writeState(readGameVersion(current), "RECOVERED", pendingHealthCheck = false)
            }
            else -> swap.deleteRecursively()
        }
    }

    private fun recoverPendingFailureUnlocked() {
        require(isValidGameDir(previous)) { "No healthy previous game bundle is available." }
        current.deleteRecursively()
        moveDirectory(previous, current)
        writeState(readGameVersion(current), "RECOVERED", pendingHealthCheck = false)
    }

    private fun rollbackUnlocked(): JSONObject {
        require(isValidGameDir(previous)) { "No previous game bundle is available." }
        val currentVersion = readGameVersion(current)
        val previousVersion = readGameVersion(previous)
        val swap = File(root, "rollback_swap")
        swap.deleteRecursively()
        moveDirectory(current, swap)
        try {
            moveDirectory(previous, current)
            moveDirectory(swap, previous)
        } catch (t: Throwable) {
            if (!current.exists() && swap.exists()) moveDirectory(swap, current)
            throw t
        }
        writeState(previousVersion, "RECOVERED", pendingHealthCheck = false)
        return JSONObject()
            .put("ok", true)
            .put("rolledBack", true)
            .put("gameVersion", previousVersion)
            .put("previousGameVersion", currentVersion)
    }

    private fun launcherVersion(): String = try {
        context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "0"
    } catch (_: Throwable) { "0" }

    private fun readState(): JSONObject = try {
        if (stateFile.isFile) JSONObject(stateFile.readText(Charsets.UTF_8)) else JSONObject()
    } catch (_: Throwable) {
        stateFile.delete()
        JSONObject()
    }

    private fun writeState(gameVersion: String, source: String, pendingHealthCheck: Boolean = false) {
        root.mkdirs()
        val payload = JSONObject()
            .put("gameVersion", gameVersion)
            .put("source", source)
            .put("pendingHealthCheck", pendingHealthCheck)
            .put("updatedAt", System.currentTimeMillis())
            .toString(2)
        val temp = File(root, "state.json.tmp")
        FileOutputStream(temp).use { output ->
            output.write(payload.toByteArray(Charsets.UTF_8))
            output.fd.sync()
        }
        try {
            Files.move(temp.toPath(), stateFile.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(temp.toPath(), stateFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }

    private fun readGameVersion(dir: File): String {
        val file = File(dir, "game-runtime.json")
        if (!file.isFile) return "0"
        return try {
            val version = JSONObject(file.readText(Charsets.UTF_8)).optString("gameVersion", "0").trim()
            if (version.matches(VERSION_RE)) version else "0"
        } catch (_: Throwable) { "0" }
    }

    private fun isValidGameDir(dir: File): Boolean = File(dir, "index.html").isFile && readGameVersion(dir) != "0"

    private fun readBundledGameVersion(): String = try {
        context.assets.open("www/game-runtime.json").bufferedReader(Charsets.UTF_8).use { reader ->
            JSONObject(reader.readText()).optString("gameVersion", "0")
        }
    } catch (_: Throwable) { "0" }

    private fun installBundledFresh() {
        current.deleteRecursively()
        staging.deleteRecursively()
        staging.mkdirs()
        copyAssetTree("www", staging)
        check(isValidGameDir(staging)) { "Bundled game assets are incomplete." }
        moveDirectory(staging, current)
        writeState(readGameVersion(current), "BUNDLED")
    }

    private fun installBundledUpgrade() {
        staging.deleteRecursively()
        staging.mkdirs()
        copyAssetTree("www", staging)
        check(isValidGameDir(staging)) { "Bundled game assets are incomplete." }
        previous.deleteRecursively()
        val oldVersion = readGameVersion(current)
        val newVersion = readGameVersion(staging)
        moveDirectory(current, previous)
        try {
            // Native app updates can also carry a bad web bundle. Keep the old game until
            // the newly bundled runtime reaches the same health confirmation as a game patch.
            writeState(newVersion, "BUNDLED", pendingHealthCheck = true)
            moveDirectory(staging, current)
        } catch (t: Throwable) {
            current.deleteRecursively()
            if (previous.exists()) moveDirectory(previous, current)
            runCatching { writeState(oldVersion, "RECOVERED", pendingHealthCheck = false) }
            throw t
        }
    }

    private fun copyAssetTree(assetPath: String, dest: File) {
        val children = context.assets.list(assetPath) ?: emptyArray()
        if (children.isNotEmpty()) {
            dest.mkdirs()
            children.forEach { child -> copyAssetTree("$assetPath/$child", File(dest, child)) }
            return
        }
        try {
            context.assets.open(assetPath).use { input ->
                dest.parentFile?.mkdirs()
                FileOutputStream(dest).use { output -> input.copyTo(output) }
            }
        } catch (t: Throwable) {
            if (!dest.exists()) dest.mkdirs() else throw t
        }
    }

    private fun download(rawUrl: String, destination: File, expectedSize: Long) {
        val parsed = URL(rawUrl)
        require(parsed.protocol.equals("https", ignoreCase = true)) { "Game bundle URL must use HTTPS." }
        val connection = parsed.openConnection() as HttpURLConnection
        connection.instanceFollowRedirects = true
        connection.connectTimeout = 20_000
        connection.readTimeout = 120_000
        connection.setRequestProperty("User-Agent", "Fantasyac-GameUpdater/${launcherVersion()}")
        try {
            connection.connect()
            require(connection.url.protocol.equals("https", ignoreCase = true)) { "Game bundle redirected to a non-HTTPS URL." }
            require(connection.responseCode in 200..299) { "Game bundle download failed: HTTP ${connection.responseCode}" }
            val reported = connection.contentLengthLong
            if (reported > 0) {
                require(reported <= MAX_ARCHIVE_BYTES) { "Game bundle is too large." }
                require(reported == expectedSize) { "Game bundle Content-Length mismatch." }
            }
            destination.parentFile?.mkdirs()
            BufferedInputStream(connection.inputStream).use { input ->
                FileOutputStream(destination).use { output -> copyWithLimit(input, output, MAX_ARCHIVE_BYTES) }
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun copyWithLimit(input: java.io.InputStream, output: java.io.OutputStream, maxBytes: Long): Long {
        val buffer = ByteArray(128 * 1024)
        var total = 0L
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            if (read == 0) continue
            total += read.toLong()
            require(total <= maxBytes) { "Game patch exceeds the allowed size." }
            output.write(buffer, 0, read)
        }
        return total
    }

    private fun unzipSafely(zipFile: File, destination: File) {
        require(zipFile.length() in 1L..MAX_ARCHIVE_BYTES) { "Game patch archive size is invalid." }
        val baseCanonical = destination.canonicalFile
        val seen = HashSet<String>()
        var totalExtracted = 0L
        var entryCount = 0
        ZipInputStream(BufferedInputStream(zipFile.inputStream())).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                entryCount += 1
                require(entryCount <= MAX_ZIP_ENTRIES) { "Game patch contains too many ZIP entries." }
                require(entry.method == ZipEntry.STORED) { "Only ZIP_STORE_V1 stored entries are allowed." }
                require(entry.size >= 0L && entry.size <= MAX_EXTRACTED_BYTES) { "ZIP entry size is invalid." }
                val normalizedName = entry.name.replace('\\', '/')
                require(normalizedName.isNotBlank() && !normalizedName.contains('\u0000')) { "Invalid ZIP entry name." }
                require(!normalizedName.startsWith('/') && !normalizedName.split('/').contains("..")) { "Unsafe ZIP path: ${entry.name}" }
                val out = File(destination, normalizedName).canonicalFile
                require(out.path == baseCanonical.path || out.path.startsWith(baseCanonical.path + File.separator)) { "ZIP path escapes staging directory." }
                require(seen.add(out.path)) { "Duplicate ZIP path: ${entry.name}" }
                if (entry.isDirectory) {
                    require(entry.size == 0L) { "ZIP directory entry has unexpected data: ${entry.name}" }
                    out.mkdirs()
                } else {
                    out.parentFile?.mkdirs()
                    var entryExtracted = 0L
                    FileOutputStream(out).use { output ->
                        val buffer = ByteArray(128 * 1024)
                        while (true) {
                            val read = zip.read(buffer)
                            if (read < 0) break
                            if (read == 0) continue
                            entryExtracted += read.toLong()
                            totalExtracted += read.toLong()
                            require(entryExtracted <= entry.size) { "ZIP entry expanded beyond declared size: ${entry.name}" }
                            require(totalExtracted <= MAX_EXTRACTED_BYTES) { "Extracted game patch is too large." }
                            output.write(buffer, 0, read)
                        }
                    }
                    require(entryExtracted == entry.size) { "ZIP entry size mismatch: ${entry.name}" }
                }
                zip.closeEntry() // ZipInputStream verifies entry CRC when available.
            }
        }
        require(entryCount > 0) { "Game patch ZIP is empty." }
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().buffered().use { input ->
            val buffer = ByteArray(128 * 1024)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun moveDirectory(from: File, to: File) {
        to.parentFile?.mkdirs()
        try {
            Files.move(from.toPath(), to.toPath(), StandardCopyOption.ATOMIC_MOVE)
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(from.toPath(), to.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
    }

    private fun compareVersions(a: String, b: String): Int {
        val pa = a.removePrefix("v").split(Regex("[.-]")).map { it.toIntOrNull() ?: 0 }
        val pb = b.removePrefix("v").split(Regex("[.-]")).map { it.toIntOrNull() ?: 0 }
        val size = maxOf(pa.size, pb.size)
        for (i in 0 until size) {
            val av = pa.getOrElse(i) { 0 }
            val bv = pb.getOrElse(i) { 0 }
            if (av != bv) return av.compareTo(bv)
        }
        return 0
    }
}
