import Foundation
import Capacitor
import Speech
import AVFoundation

/// جسر Capacitor بين طبقة React (src/lib/plugins/speech-recognition.ts)
/// والتعرف الصوتي الأصلي عبر إطار Speech من آبل (SFSpeechRecognizer).
///
/// أخطاء حرجة تُرفض بـ`call.reject(code:)` — لا تُعاد `matches: []` بصمت.
@objc(MajlisSpeechRecognitionPlugin)
public class MajlisSpeechRecognitionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisSpeechRecognitionPlugin"
    public let jsName = "MajlisSpeechRecognition"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var startCall: CAPPluginCall?
    private var lastTranscript: String = ""
    private var mediaResetObserver: NSObjectProtocol?

    public override func load() {
        super.load()
        mediaResetObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleMediaServicesReset()
        }
    }

    deinit {
        if let mediaResetObserver {
            NotificationCenter.default.removeObserver(mediaResetObserver)
        }
        stopAudioSession()
    }

    @objc func available(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: call.getString("language") ?? "ar-SA"))
        call.resolve(["available": recognizer?.isAvailable ?? false])
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { speechStatus in
            AVAudioSession.sharedInstance().requestRecordPermission { micGranted in
                DispatchQueue.main.async {
                    let speech: String
                    switch speechStatus {
                    case .authorized: speech = "granted"
                    case .denied: speech = "denied"
                    case .restricted: speech = "restricted"
                    case .notDetermined: speech = "prompt"
                    @unknown default: speech = "denied"
                    }
                    let mic = micGranted ? "granted" : "denied"
                    // requestRecordPermission يُعيد granted/denied فقط (بعد الحوار).
                    // نُبقي "prompt" فقط إن بقي إذن الكلام غير محسوم.
                    let combined: String
                    if speech == "granted" && mic == "granted" {
                        combined = "granted"
                    } else if speech == "prompt" {
                        combined = "prompt"
                    } else {
                        combined = "denied"
                    }
                    call.resolve([
                        "speechRecognition": combined,
                        "speech": speech,
                        "microphone": mic,
                    ])
                }
            }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        // جلسة واحدة كحد أقصى: ارفض الجلسة السابقة برمز واضح ثم المضي قدمًا.
        finishPendingCall(rejectCode: "SESSION_SUPERSEDED", message: "استُبدلت جلسة التعرّف بجلسة أحدث")
        stopAudioSession()

        let langCode = call.getString("language") ?? "ar-SA"
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: langCode)), recognizer.isAvailable else {
            call.reject("محرّك التعرّف الصوتي غير متاح لهذه اللغة", "RECOGNIZER_UNAVAILABLE")
            return
        }

        let speechAuth = SFSpeechRecognizer.authorizationStatus()
        guard speechAuth == .authorized else {
            let code = speechAuth == .notDetermined ? "SPEECH_NOT_DETERMINED" : "SPEECH_DENIED"
            call.reject("إذن التعرّف على الكلام غير ممنوح", code)
            return
        }

        let audioSession = AVAudioSession.sharedInstance()
        // iOS 17+: recordPermission deprecated لصالح AVAudioApplication — نبقى متوافقين مع هدف النشر 16.2
        switch audioSession.recordPermission {
        case .denied:
            call.reject("إذن الميكروفون مرفوض", "MICROPHONE_DENIED")
            return
        case .undetermined:
            call.reject("إذن الميكروفون غير محسوم — اطلب الأذونات أولًا", "MICROPHONE_NOT_DETERMINED")
            return
        case .granted:
            break
        @unknown default:
            call.reject("إذن الميكروفون غير معروف", "MICROPHONE_DENIED")
            return
        }

        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.reject(
                "تعذّر تفعيل جلسة الصوت: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if #available(iOS 13, *) {
            request.requiresOnDeviceRecognition = recognizer.supportsOnDeviceRecognition
        }
        recognitionRequest = request
        lastTranscript = ""

        call.keepAlive = true
        startCall = call

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        // صيغة غير صالحة (0Hz) شائعة بعد media services reset أو بلا مسار إدخال
        guard recordingFormat.sampleRate > 0, recordingFormat.channelCount > 0 else {
            stopAudioSession()
            startCall = nil
            call.reject("صيغة مدخل الميكروفون غير صالحة", "AUDIO_FORMAT_INVALID")
            return
        }

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            recognitionRequest = nil
            startCall = nil
            stopAudioSession()
            call.reject(
                "تعذّر بدء محرك الصوت: \(error.localizedDescription)",
                "ENGINE_START_FAILED",
                error
            )
            return
        }

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                self.lastTranscript = result.bestTranscription.formattedString
                var words: [String] = []
                var confidences: [Double] = []
                for segment in result.bestTranscription.segments {
                    let w = segment.substring.trimmingCharacters(in: .whitespacesAndNewlines)
                    if w.isEmpty { continue }
                    words.append(w)
                    confidences.append(Double(segment.confidence) * 100.0)
                }
                var payload: [String: Any] = ["matches": [self.lastTranscript]]
                if !words.isEmpty {
                    payload["words"] = words
                    payload["confidences"] = confidences
                }
                self.notifyListeners("partialResults", data: payload)
                if result.isFinal {
                    self.finishPendingCall(withMatches: [self.lastTranscript])
                }
            }
            if let error = error {
                // إن وُجد نص جزئي معتبر نُنهيه بنجاح؛ وإلا رفض مُصنَّف
                let trimmed = self.lastTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    self.finishPendingCall(withMatches: [trimmed])
                } else {
                    let ns = error as NSError
                    let code = Self.classifyRecognitionError(ns)
                    self.finishPendingCall(
                        rejectCode: code,
                        message: "فشل التعرّف الصوتي: \(error.localizedDescription)",
                        error: error
                    )
                }
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        let trimmed = lastTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            finishPendingCall(
                rejectCode: "NO_SPEECH_DETECTED",
                message: "لم يُلتقط كلام مفهوم قبل إيقاف الجلسة"
            )
        } else {
            finishPendingCall(withMatches: [trimmed])
        }
        call.resolve()
    }

    private func finishPendingCall(withMatches matches: [String]) {
        stopAudioSession()
        if let call = startCall {
            call.resolve(["matches": matches])
            startCall = nil
        }
    }

    private func finishPendingCall(rejectCode: String, message: String, error: Error? = nil) {
        stopAudioSession()
        if let call = startCall {
            call.reject(message, rejectCode, error)
            startCall = nil
        }
    }

    private func handleMediaServicesReset() {
        NSLog("[MajlisSpeech] media services reset — tearing down recognition session")
        finishPendingCall(
            rejectCode: "MEDIA_SERVICES_RESET",
            message: "أُعيد ضبط خدمات الصوت في النظام — أعد المحاولة"
        )
        notifyListeners("audioSessionError", data: [
            "op": "media_services_reset",
            "message": "AVAudioSession media services were reset",
        ])
    }

    private func stopAudioSession() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        } else {
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        } catch {
            NSLog("[MajlisSpeech] AVAudioSession deactivate failed: %@", error.localizedDescription)
            notifyListeners("audioSessionError", data: [
                "op": "deactivate",
                "message": error.localizedDescription,
            ])
        }
    }

    private static func classifyRecognitionError(_ error: NSError) -> String {
        // SFSpeechRecognizer / AVAudioEngine domain codes
        if error.domain == "kAFAssistantErrorDomain" {
            switch error.code {
            case 1110: return "NO_SPEECH_DETECTED"
            case 1101, 1107: return "RECOGNITION_FAILED"
            default: break
            }
        }
        if error.domain == NSURLErrorDomain {
            return "NETWORK"
        }
        return "RECOGNITION_FAILED"
    }
}
