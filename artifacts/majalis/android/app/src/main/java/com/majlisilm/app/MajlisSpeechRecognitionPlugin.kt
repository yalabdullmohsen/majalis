package com.majlisilm.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * جسر Capacitor بين طبقة React (src/lib/plugins/speech-recognition.ts)
 * والتعرف الصوتي الأصلي عبر android.speech.SpeechRecognizer — مكافئ أندرويد
 * لـ MajlisSpeechRecognitionPlugin.swift (iOS)، بنفس واجهة الدوال والأحداث
 * بالضبط ليعمل الكود المشترك في speech-recognition.ts بلا تغيير على الجانبين.
 *
 * لا يُسجَّل الصوت لملف ولا يُرفَع لخوادم مجالس؛ يُمرَّر مباشرة لمحرّك التعرف
 * الصوتي المحلي للجهاز (أو خدمة جوجل الافتراضية إن لم يتوفر تعرّف على الجهاز
 * — نفس تحذير الخصوصية المُفصح عنه أصلاً في RecitationTestPanel.tsx وسياسة
 * الخصوصية لجانب iOS، ينطبق هنا بالمثل).
 *
 * تنبيه توثيقي: كُتب هذا الملف بلا Android SDK متاح في بيئة التطوير هذه —
 * لم يُبنَ (gradle) ولم يُختبَر على محاكي/جهاز فعلي، خلافًا لكل تعديل آخر في
 * هذا المستودع. يحتاج بناءً واختبارًا حقيقيين على جهاز يملك Android SDK قبل
 * الوثوق به إنتاجيًا.
 */
@CapacitorPlugin(
    name = "MajlisSpeechRecognition",
    permissions = [
        Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "speechRecognition")
    ]
)
class MajlisSpeechRecognitionPlugin : Plugin() {

    private var speechRecognizer: SpeechRecognizer? = null
    private var startCall: PluginCall? = null
    private var lastTranscript: String = ""

    @PluginMethod
    fun available(call: PluginCall) {
        val available = SpeechRecognizer.isRecognitionAvailable(context)
        val result = JSObject()
        result.put("available", available)
        call.resolve(result)
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        if (getPermissionState("speechRecognition") == com.getcapacitor.PermissionState.GRANTED) {
            resolvePermissionResult(call, true)
            return
        }
        requestPermissionForAlias("speechRecognition", call, "permissionCallback")
    }

    @PermissionCallback
    private fun permissionCallback(call: PluginCall) {
        val granted = getPermissionState("speechRecognition") == com.getcapacitor.PermissionState.GRANTED
        resolvePermissionResult(call, granted)
    }

    private fun resolvePermissionResult(call: PluginCall, granted: Boolean) {
        val result = JSObject()
        result.put("speechRecognition", if (granted) "granted" else "denied")
        call.resolve(result)
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            val result = JSObject()
            result.put("matches", JSArray())
            call.resolve(result)
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            val result = JSObject()
            result.put("matches", JSArray())
            call.resolve(result)
            return
        }

        // جلسة واحدة كحد أقصى: أنهِ أي جلسة سابقة عالقة أولًا (نفس نمط iOS).
        finishPendingCall(lastTranscript)
        stopListening()

        val langCode = call.getString("language", "ar-SA")
        lastTranscript = ""
        call.setKeepAlive(true)
        startCall = call

        activity.runOnUiThread {
            val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
            speechRecognizer = recognizer

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, langCode)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            }

            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}

                override fun onError(error: Int) {
                    finishPendingCall(lastTranscript)
                }

                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val best = matches?.firstOrNull() ?: lastTranscript
                    lastTranscript = best
                    finishPendingCall(best)
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val best = matches?.firstOrNull()
                    if (best != null) {
                        lastTranscript = best
                        val data = JSObject()
                        val arr = JSArray()
                        arr.put(best)
                        data.put("matches", arr)
                        notifyListeners("partialResults", data)
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })

            recognizer.startListening(intent)
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        finishPendingCall(lastTranscript)
        call.resolve()
    }

    private fun finishPendingCall(transcript: String) {
        stopListening()
        val call = startCall
        if (call != null) {
            val result = JSObject()
            val arr = JSArray()
            if (transcript.isNotEmpty()) arr.put(transcript)
            result.put("matches", arr)
            call.resolve(result)
            startCall = null
        }
    }

    private fun stopListening() {
        activity.runOnUiThread {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
            speechRecognizer = null
        }
    }
}
