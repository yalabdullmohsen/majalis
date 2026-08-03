package com.mushafi.mushafi

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.app.ActivityCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import kotlin.concurrent.thread

class MainActivity : FlutterActivity() {
    private val methodChannelName = "tasmee3_pcm_audio/methods"
    private val eventChannelName = "tasmee3_pcm_audio/events"

    private var audioRecord: AudioRecord? = null
    @Volatile private var isRecording = false
    private var eventSink: EventChannel.EventSink? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            methodChannelName
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "isAvailable" -> {
                    val granted = ActivityCompat.checkSelfPermission(
                        this,
                        Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED

                    // Android PCM path is implemented; availability also needs mic permission.
                    result.success(granted)
                }

                "start" -> {
                    val args = call.arguments as? Map<*, *>
                    val sampleRate = (args?.get("sampleRate") as? Number)?.toInt() ?: 16000
                    val channels = (args?.get("channels") as? Number)?.toInt() ?: 1
                    val chunkSizeBytes =
                        (args?.get("chunkSizeBytes") as? Number)?.toInt() ?: 3200

                    startPcmRecording(sampleRate, channels, chunkSizeBytes)
                    result.success(null)
                }

                "stop" -> {
                    stopPcmRecording()
                    result.success(null)
                }

                else -> result.notImplemented()
            }
        }

        EventChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            eventChannelName
        ).setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                eventSink = events
            }

            override fun onCancel(arguments: Any?) {
                eventSink = null
            }
        })
    }

    private fun startPcmRecording(
        sampleRate: Int,
        channels: Int,
        chunkSizeBytes: Int
    ) {
        if (isRecording) return

        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            eventSink?.error("NO_PERMISSION", "RECORD_AUDIO permission not granted", null)
            return
        }

        val channelConfig = if (channels == 1) {
            AudioFormat.CHANNEL_IN_MONO
        } else {
            AudioFormat.CHANNEL_IN_STEREO
        }

        val minBufferSize = AudioRecord.getMinBufferSize(
            sampleRate,
            channelConfig,
            AudioFormat.ENCODING_PCM_16BIT
        )

        if (minBufferSize <= 0) {
            eventSink?.error("AUDIO_INIT", "Invalid AudioRecord buffer size", null)
            return
        }

        val bufferSize = maxOf(minBufferSize, chunkSizeBytes)

        val recorder = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            sampleRate,
            channelConfig,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            recorder.release()
            eventSink?.error("AUDIO_INIT", "AudioRecord failed to initialize", null)
            return
        }

        audioRecord = recorder
        recorder.startRecording()
        isRecording = true

        thread(start = true, name = "tasmee3-pcm-record") {
            val buffer = ByteArray(chunkSizeBytes)

            while (isRecording) {
                val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0

                if (read > 0) {
                    val data = buffer.copyOf(read)

                    runOnUiThread {
                        eventSink?.success(data)
                    }
                }
            }
        }
    }

    private fun stopPcmRecording() {
        isRecording = false

        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }

        try {
            audioRecord?.release()
        } catch (_: Exception) {
        }

        audioRecord = null
    }

    override fun onDestroy() {
        stopPcmRecording()
        super.onDestroy()
    }
}
