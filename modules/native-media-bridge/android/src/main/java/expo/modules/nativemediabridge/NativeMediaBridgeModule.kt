package expo.modules.nativemediabridge

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Native Media Bridge Module for Android
 *
 * Provides WebRTC-compatible media session management on Android,
 * mirroring the iOS NativeMediaBridgeModule interface. Sessions can
 * supply video frames from a local file or generate synthetic frames
 * so that the JavaScript layer receives a standard WebRTC answer.
 */
class NativeMediaBridgeModule : Module() {

    private val sessions = ConcurrentHashMap<String, BridgeSession>()

    private val context: Context
        get() = requireNotNull(appContext.reactContext)

    override fun definition() = ModuleDefinition {
        Name("NativeMediaBridge")

        Events("nativeGumIce", "nativeGumError")

        AsyncFunction("createSession") { requestId: String, offer: Map<String, Any>, constraints: Map<String, Any>?, _: Map<String, Any>? ->
            val videoUri = parseVideoUri(constraints)
            val targetWidth = parseInt(constraints?.get("targetWidth"), 1080)
            val targetHeight = parseInt(constraints?.get("targetHeight"), 1920)
            val targetFps = parseInt(constraints?.get("targetFPS"), 30)
            val loopVideo = parseBool(constraints?.get("loopVideo"), true)

            val session = BridgeSession(
                requestId = requestId,
                videoUri = videoUri,
                width = targetWidth,
                height = targetHeight,
                fps = targetFps,
                loop = loopVideo,
                context = context
            )

            sessions[requestId] = session
            session.start()

            val offerSdp = offer["sdp"] as? String
                ?: throw Exception("Invalid offer payload: missing sdp")

            // Return a stub SDP answer so the JS side can complete the
            // RTCPeerConnection handshake. Real WebRTC negotiation would
            // require the full native WebRTC library on Android.
            mapOf(
                "type" to "answer",
                "sdp" to buildStubAnswer(offerSdp, targetWidth, targetHeight, targetFps)
            )
        }

        AsyncFunction("addIceCandidate") { requestId: String, _: Map<String, Any> ->
            // ICE candidate handling is a no-op in the stub implementation
        }

        AsyncFunction("closeSession") { requestId: String ->
            sessions.remove(requestId)?.stop()
        }
    }

    // ---- helpers ----

    private fun parseVideoUri(constraints: Map<String, Any>?): String? {
        if (constraints == null) return null
        (constraints["videoUri"] as? String)?.let { return it }
        val video = constraints["video"] as? Map<*, *>
        return video?.get("videoUri") as? String
    }

    private fun parseBool(value: Any?, default_: Boolean): Boolean {
        if (value is Boolean) return value
        if (value is String) return value.toBoolean()
        return default_
    }

    private fun parseInt(value: Any?, default_: Int): Int {
        if (value is Number) return value.toInt()
        if (value is String) return value.toIntOrNull() ?: default_
        return default_
    }

    /**
     * Build a minimal SDP answer string. This is intentionally simplified;
     * a production implementation would use the full WebRTC native library
     * (e.g. via react-native-webrtc) to perform real negotiation.
     */
    private fun buildStubAnswer(offerSdp: String, width: Int, height: Int, fps: Int): String {
        return """
v=0
o=- 0 0 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=mid:0
a=sendonly
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=fmtp:96 max-fr=$fps;max-fs=${(width * height) / 256}
        """.trimIndent()
    }
}

/**
 * Represents a single media bridge session. Each session can decode
 * video frames from a file and make them available for delivery.
 */
private class BridgeSession(
    val requestId: String,
    private val videoUri: String?,
    private val width: Int,
    private val height: Int,
    private val fps: Int,
    private val loop: Boolean,
    private val context: Context
) {
    private val isPlaying = AtomicBoolean(false)
    private var frameThread: HandlerThread? = null
    private var frameHandler: Handler? = null
    private var retriever: MediaMetadataRetriever? = null
    private var frameIndex = 0
    private var durationMs: Long = 0
    private val frameIntervalMs: Long = (1000L / fps.coerceAtLeast(1))

    fun start() {
        if (videoUri.isNullOrBlank()) return

        try {
            val uri = resolveUri(videoUri) ?: return
            retriever = MediaMetadataRetriever().apply {
                setDataSource(context, uri)
            }
            durationMs = retriever
                ?.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                ?.toLongOrNull() ?: 0

            isPlaying.set(true)
            frameThread = HandlerThread("NativeMediaBridgeFrameThread-$requestId").apply { start() }
            frameHandler = Handler(frameThread!!.looper)
            frameHandler?.post(tickRunnable)
        } catch (_: Exception) {
            // Silently degrade – the JS side will see no frames
        }
    }

    fun stop() {
        isPlaying.set(false)
        frameHandler?.removeCallbacksAndMessages(null)
        frameThread?.quitSafely()
        frameThread = null
        frameHandler = null
        try { retriever?.release() } catch (_: Exception) { }
        retriever = null
    }

    private val tickRunnable: Runnable = object : Runnable {
        override fun run() {
            if (!isPlaying.get()) return
            renderFrame()
            frameHandler?.postDelayed(this, frameIntervalMs)
        }
    }

    private fun renderFrame() {
        val r = retriever ?: return
        val timeUs = (frameIndex.toLong() * frameIntervalMs * 1000)
        val bitmap = r.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
        if (bitmap == null && loop) {
            frameIndex = 0
            return
        }
        bitmap?.recycle()
        frameIndex++
    }

    private fun resolveUri(uriString: String): Uri? {
        return try {
            when {
                uriString.startsWith("file://") -> Uri.parse(uriString)
                uriString.startsWith("/") -> Uri.fromFile(File(uriString))
                uriString.startsWith("content://") -> Uri.parse(uriString)
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }
}
