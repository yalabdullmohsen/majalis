import Foundation
import Capacitor
import Speech
import AVFoundation

/// جسر Capacitor بين طبقة React (src/lib/plugins/speech-recognition.ts)
/// والتعرف الصوتي الأصلي عبر إطار Speech من آبل (SFSpeechRecognizer) —
/// يُستخدَم حصرًا لميزة "اختبر تلاوتك" في المصحف التفاعلي. حزم Capacitor
/// المجتمعية للتعرف الصوتي تعتمد CocoaPods فقط، وهذا المشروع يستخدم Swift
/// Package Manager حصرًا (راجع CapApp-SPM) — فكُتب جسر محلي مباشر، بنفس
/// نمط PrayerLiveActivityPlugin.swift الموجود أصلاً في هذا الملف المجاور.
///
/// لا يُسجَّل الصوت لملف ولا يُرفَع لخوادم مجالس؛ يُمرَّر مباشرة إلى محرّك
/// التعرف الصوتي المحلي لنظام iOS، الذي قد يستخدم معالجة على خوادم آبل حين
/// لا يتوفر تعرّف كامل على الجهاز للغة العربية — مُفصح عنه صراحة في واجهة
/// الموافقة (RecitationTestPanel.tsx) وسياسة الخصوصية قبل أول استخدام.
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

    @objc func available(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: call.getString("language") ?? "ar-SA"))
        call.resolve(["available": recognizer?.isAvailable ?? false])
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { speechStatus in
            AVAudioSession.sharedInstance().requestRecordPermission { micGranted in
                DispatchQueue.main.async {
                    let granted = speechStatus == .authorized && micGranted
                    let status = granted ? "granted" : "denied"
                    call.resolve(["speechRecognition": status])
                }
            }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        // جلسة واحدة كحد أقصى: أنهِ أي جلسة سابقة عالقة أولًا.
        finishPendingCall(withMatches: [])
        stopAudioSession()

        let langCode = call.getString("language") ?? "ar-SA"
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: langCode)), recognizer.isAvailable else {
            call.resolve(["matches": []])
            return
        }

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.resolve(["matches": []])
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
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            recognitionRequest = nil
            call.resolve(["matches": []])
            startCall = nil
            return
        }

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                self.lastTranscript = result.bestTranscription.formattedString
                self.notifyListeners("partialResults", data: ["matches": [self.lastTranscript]])
                if result.isFinal {
                    self.finishPendingCall(withMatches: [self.lastTranscript])
                }
            }
            if error != nil {
                self.finishPendingCall(withMatches: [self.lastTranscript])
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        finishPendingCall(withMatches: [lastTranscript])
        call.resolve()
    }

    private func finishPendingCall(withMatches matches: [String]) {
        stopAudioSession()
        if let call = startCall {
            call.resolve(["matches": matches])
            startCall = nil
        }
    }

    private func stopAudioSession() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
