import Foundation
import Capacitor
import Speech
import AVFoundation
import os.signpost

/// جسر Capacitor للتعرّف الصوتي (SFSpeechRecognizer + AVAudioEngine).
///
/// تحسين الكمون (2026-07-30):
/// - `prepare`: يجهّز AVAudioSession + يُحضّر المحرك عند فتح الصفحة (لا عند الزر فقط)
/// - إعادة استخدام AVAudioEngine بدل هدمه في كل جلسة
/// - فصل إيقاف مهمة التعرّف عن إيقاف الجلسة الدافئة
/// - partialResults فورية + مستويات صوت + قياسات زمن (بدون نص/صوت حسّاس)
@objc(MajlisSpeechRecognitionPlugin)
public class MajlisSpeechRecognitionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisSpeechRecognitionPlugin"
    public let jsName = "MajlisSpeechRecognition"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "teardown", returnType: CAPPluginReturnPromise),
    ]

    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var cachedRecognizer: SFSpeechRecognizer?
    private var cachedLocaleId: String = "ar-SA"
    private var startCall: CAPPluginCall?
    private var lastTranscript: String = ""
    private var mediaResetObserver: NSObjectProtocol?
    private var interruptionObserver: NSObjectProtocol?
    private var routeObserver: NSObjectProtocol?

    /// جلسة صوت دافئة جاهزة للاستماع السريع
    private var sessionPrepared = false
    private var enginePrepared = false
    private var tapInstalled = false
    private var sessionGeneration: UInt64 = 0

    // Latency instrumentation (timestamps only — no audio/text)
    private var tPrepareStart: CFAbsoluteTime = 0
    private var tSessionReady: CFAbsoluteTime = 0
    private var tTapStart: CFAbsoluteTime = 0
    private var tFirstBuffer: CFAbsoluteTime = 0
    private var tFirstPartial: CFAbsoluteTime = 0
    private var receivedFirstBuffer = false
    private var receivedFirstPartial = false
    private var firstBufferWatchdog: DispatchWorkItem?
    private var isColdStart = true

    private let log = OSLog(subsystem: "com.yousef.majlisilm", category: "RecitationSpeech")
    private var signpostID: OSSignpostID { OSSignpostID(log: log) }

    public override func load() {
        super.load()
        mediaResetObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleMediaServicesReset()
        }
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] note in
            self?.handleInterruption(note)
        }
        routeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] note in
            self?.handleRouteChange(note)
        }
    }

    deinit {
        if let mediaResetObserver { NotificationCenter.default.removeObserver(mediaResetObserver) }
        if let interruptionObserver { NotificationCenter.default.removeObserver(interruptionObserver) }
        if let routeObserver { NotificationCenter.default.removeObserver(routeObserver) }
        cancelFirstBufferWatchdog()
        teardownEngineAndSession()
    }

    // MARK: - Public API

    @objc func available(_ call: CAPPluginCall) {
        let lang = call.getString("language") ?? "ar-SA"
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: lang))
        var payload: [String: Any] = ["available": recognizer?.isAvailable ?? false]
        if let recognizer, #available(iOS 13, *) {
            payload["onDevice"] = recognizer.supportsOnDeviceRecognition
        }
        call.resolve(payload)
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
                    let combined: String
                    if speech == "granted" && mic == "granted" {
                        combined = "granted"
                    } else if speech == "prompt" {
                        combined = "prompt"
                    } else if speech == "restricted" {
                        combined = "restricted"
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

    /// يجهّز الجلسة والمحرك مسبقًا — يُستدعى عند فتح صفحة التسميع.
    @objc func prepare(_ call: CAPPluginCall) {
        tPrepareStart = CFAbsoluteTimeGetCurrent()
        os_signpost(.begin, log: log, name: "prepare")

        let langCode = call.getString("language") ?? "ar-SA"
        do {
            try ensurePermissionsOrThrow()
            try activateRecordingSessionIfNeeded()
            try prepareEngineIfNeeded(localeId: langCode)
            tSessionReady = CFAbsoluteTimeGetCurrent()
            sessionPrepared = true
            os_signpost(.end, log: log, name: "prepare")
            notifyLatency(event: "prepare_ready", extra: [
                "ms": msSince(tPrepareStart),
                "cold": isColdStart,
            ])
            call.resolve([
                "ok": true,
                "prepared": true,
                "cold": isColdStart,
                "prepareMs": msSince(tPrepareStart),
            ])
        } catch let err as SpeechPluginError {
            os_signpost(.end, log: log, name: "prepare")
            call.reject(err.message, err.code)
        } catch {
            os_signpost(.end, log: log, name: "prepare")
            call.reject(
                "تعذّر تهيئة الميكروفون: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        let tButton = CFAbsoluteTimeGetCurrent()
        os_signpost(.begin, log: log, name: "start_to_listen")

        // جلسة واحدة كحد أقصى: ألغِ المهمة السابقة بالكامل قبل البدء
        cancelActiveRecognition(rejectCode: "SESSION_SUPERSEDED", message: "استُبدلت جلسة التعرّف بجلسة أحدث")

        let langCode = call.getString("language") ?? "ar-SA"
        let wantPartials = call.getBool("partialResults") ?? true
        let preferOnDevice = call.getBool("preferOnDevice") ?? true

        do {
            try ensurePermissionsOrThrow()
            try activateRecordingSessionIfNeeded()
            try prepareEngineIfNeeded(localeId: langCode)
        } catch let err as SpeechPluginError {
            os_signpost(.end, log: log, name: "start_to_listen")
            call.reject(err.message, err.code)
            return
        } catch {
            os_signpost(.end, log: log, name: "start_to_listen")
            call.reject(
                "تعذّر تفعيل جلسة الصوت: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
            return
        }

        guard let recognizer = cachedRecognizer, recognizer.isAvailable else {
            os_signpost(.end, log: log, name: "start_to_listen")
            call.reject("محرّك التعرّف الصوتي غير متاح لهذه اللغة", "RECOGNIZER_UNAVAILABLE")
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = wantPartials
        if preferOnDevice, #available(iOS 13, *) {
            // لا نفرض on-device إن كان سيمنع العمل — فقط عند الدعم الفعلي
            if recognizer.supportsOnDeviceRecognition {
                request.requiresOnDeviceRecognition = true
            }
        }
        recognitionRequest = request
        lastTranscript = ""
        receivedFirstBuffer = false
        receivedFirstPartial = false
        tFirstBuffer = 0
        tFirstPartial = 0
        sessionGeneration &+= 1
        let gen = sessionGeneration

        call.keepAlive = true
        startCall = call

        // ثبّت/أعد tap إن لزم — بدون هدم المحرك إن كان يعمل
        do {
            try ensureTapInstalled()
        } catch let err as SpeechPluginError {
            recognitionRequest = nil
            startCall = nil
            os_signpost(.end, log: log, name: "start_to_listen")
            call.reject(err.message, err.code)
            return
        } catch {
            recognitionRequest = nil
            startCall = nil
            os_signpost(.end, log: log, name: "start_to_listen")
            call.reject(
                "تعذّر تهيئة مدخل الميكروفون: \(error.localizedDescription)",
                "AUDIO_FORMAT_INVALID",
                error
            )
            return
        }

        tTapStart = CFAbsoluteTimeGetCurrent()
        notifyLatency(event: "tap_started", extra: [
            "msFromButton": msBetween(tButton, tTapStart),
            "cold": isColdStart,
            "sessionPrepared": sessionPrepared,
        ])

        if !audioEngine.isRunning {
            do {
                try audioEngine.start()
            } catch {
                recognitionRequest = nil
                startCall = nil
                removeTapOnly()
                os_signpost(.end, log: log, name: "start_to_listen")
                call.reject(
                    "تعذّر بدء محرك الصوت: \(error.localizedDescription)",
                    "ENGINE_START_FAILED",
                    error
                )
                return
            }
        }

        // Watchdog: لا buffer خلال ثانية → خطأ واضح
        scheduleFirstBufferWatchdog(generation: gen)

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            guard self.sessionGeneration == gen else { return }

            if let result = result {
                self.lastTranscript = result.bestTranscription.formattedString
                if !self.receivedFirstPartial {
                    self.receivedFirstPartial = true
                    self.tFirstPartial = CFAbsoluteTimeGetCurrent()
                    self.notifyLatency(event: "first_partial", extra: [
                        "msFromButton": self.msBetween(tButton, self.tFirstPartial),
                        "msFromTap": self.msBetween(self.tTapStart, self.tFirstPartial),
                        "msFromFirstBuffer": self.tFirstBuffer > 0
                            ? self.msBetween(self.tFirstBuffer, self.tFirstPartial) : -1,
                        "cold": self.isColdStart,
                    ])
                    os_signpost(.end, log: self.log, name: "start_to_listen")
                }

                var words: [String] = []
                var confidences: [Double] = []
                for segment in result.bestTranscription.segments {
                    let w = segment.substring.trimmingCharacters(in: .whitespacesAndNewlines)
                    if w.isEmpty { continue }
                    words.append(w)
                    confidences.append(Double(segment.confidence) * 100.0)
                }
                var payload: [String: Any] = [
                    "matches": [self.lastTranscript],
                    "isFinal": result.isFinal,
                ]
                if !words.isEmpty {
                    payload["words"] = words
                    payload["confidences"] = confidences
                }
                self.notifyListeners("partialResults", data: payload)

                if result.isFinal {
                    self.finishPendingCall(withMatches: [self.lastTranscript], keepWarm: true)
                }
            }

            if let error = error {
                let trimmed = self.lastTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    self.finishPendingCall(withMatches: [trimmed], keepWarm: true)
                } else {
                    let ns = error as NSError
                    let code = Self.classifyRecognitionError(ns)
                    self.finishPendingCall(
                        rejectCode: code,
                        message: "فشل التعرّف الصوتي: \(error.localizedDescription)",
                        error: error,
                        keepWarm: true
                    )
                }
            }
        }

        isColdStart = false
        notifyLatency(event: "listening", extra: [
            "msFromButton": msSince(tButton),
            "cold": false,
        ])
        notifyListeners("listeningState", data: ["state": "listening"])
    }

    @objc func stop(_ call: CAPPluginCall) {
        cancelFirstBufferWatchdog()
        let trimmed = lastTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            finishPendingCall(
                rejectCode: "NO_SPEECH_DETECTED",
                message: "لم يُلتقط كلام مفهوم قبل إيقاف الجلسة",
                keepWarm: true
            )
        } else {
            finishPendingCall(withMatches: [trimmed], keepWarm: true)
        }
        call.resolve(["ok": true])
    }

    /// إيقاف دافئ كامل عند مغادرة الصفحة — يحرّر الجلسة والمحرك.
    @objc func teardown(_ call: CAPPluginCall) {
        cancelActiveRecognition(rejectCode: nil, message: nil)
        teardownEngineAndSession()
        sessionPrepared = false
        isColdStart = true
        call.resolve(["ok": true])
    }

    // MARK: - Session / Engine

    private struct SpeechPluginError: Error {
        let code: String
        let message: String
    }

    private func ensurePermissionsOrThrow() throws {
        let speechAuth = SFSpeechRecognizer.authorizationStatus()
        guard speechAuth == .authorized else {
            let code = speechAuth == .notDetermined ? "SPEECH_NOT_DETERMINED" : "SPEECH_DENIED"
            throw SpeechPluginError(code: code, message: "إذن التعرّف على الكلام غير ممنوح")
        }
        let audioSession = AVAudioSession.sharedInstance()
        switch audioSession.recordPermission {
        case .denied:
            throw SpeechPluginError(code: "MICROPHONE_DENIED", message: "إذن الميكروفون مرفوض")
        case .undetermined:
            throw SpeechPluginError(code: "MICROPHONE_NOT_DETERMINED", message: "إذن الميكروفون غير محسوم — اطلب الأذونات أولًا")
        case .granted:
            break
        @unknown default:
            throw SpeechPluginError(code: "MICROPHONE_DENIED", message: "إذن الميكروفون غير معروف")
        }
    }

    /// فئة موحّدة مع مسار التسجيل في MajlisPlaybackAudio لتفادي thrash category.
    private func activateRecordingSessionIfNeeded() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .measurement,
            options: [.duckOthers, .defaultToSpeaker, .allowBluetoothHFP]
        )
        // تجنّب setActive المتكرر إن كانت الجلسة نشطة بالفعل بنفس الفئة تقريبًا
        if !sessionPrepared {
            try session.setActive(true, options: [])
        } else {
            do {
                try session.setActive(true, options: [])
            } catch {
                // إن فشل إعادة التفعيل بعد مقاطعة — أعد المحاولة مرة
                try session.setActive(true, options: [])
            }
        }
    }

    private func prepareEngineIfNeeded(localeId: String) throws {
        if cachedRecognizer == nil || cachedLocaleId != localeId {
            cachedRecognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId))
            cachedLocaleId = localeId
        }
        guard cachedRecognizer != nil else {
            throw SpeechPluginError(code: "RECOGNIZER_UNAVAILABLE", message: "محرّك التعرّف الصوتي غير متاح لهذه اللغة")
        }
        if !enginePrepared {
            audioEngine.prepare()
            enginePrepared = true
        }
    }

    private func ensureTapInstalled() throws {
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        guard recordingFormat.sampleRate > 0, recordingFormat.channelCount > 0 else {
            throw SpeechPluginError(code: "AUDIO_FORMAT_INVALID", message: "صيغة مدخل الميكروفون غير صالحة")
        }

        if tapInstalled {
            inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }

        // buffer أصغر → أول إطار أسرع
        inputNode.installTap(onBus: 0, bufferSize: 512, format: recordingFormat) { [weak self] buffer, _ in
            guard let self = self else { return }
            if !self.receivedFirstBuffer {
                self.receivedFirstBuffer = true
                self.tFirstBuffer = CFAbsoluteTimeGetCurrent()
                self.cancelFirstBufferWatchdog()
                self.notifyLatency(event: "first_buffer", extra: [
                    "msFromTap": self.msBetween(self.tTapStart, self.tFirstBuffer),
                    "cold": self.isColdStart,
                ])
            }
            // مستوى صوت تقريبي للواجهة (RMS) — بلا إرسال عينات خام
            let level = Self.rmsLevel(buffer)
            self.notifyListeners("audioLevel", data: ["level": level])
            self.recognitionRequest?.append(buffer)
        }
        tapInstalled = true
    }

    private func removeTapOnly() {
        if tapInstalled {
            audioEngine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
    }

    private func cancelActiveRecognition(rejectCode: String?, message: String?) {
        cancelFirstBufferWatchdog()
        if let rejectCode, let message, startCall != nil {
            finishPendingCall(rejectCode: rejectCode, message: message, keepWarm: true)
            return
        }
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        if audioEngine.isRunning {
            // أبقِ المحرك دافئًا إن أمكن — أوقف فقط تدفق التعرّف
            removeTapOnly()
        }
        if startCall != nil {
            startCall = nil
        }
    }

    private func finishPendingCall(withMatches matches: [String], keepWarm: Bool) {
        cancelFirstBufferWatchdog()
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        removeTapOnly()
        if !keepWarm {
            teardownEngineAndSession()
        } else if audioEngine.isRunning {
            // أوقف المحرك مؤقتًا لتقليل استهلاك الطاقة، مع الإبقاء على الجلسة الدافئة
            audioEngine.stop()
            audioEngine.prepare()
            enginePrepared = true
        }
        if let call = startCall {
            call.resolve(["matches": matches])
            startCall = nil
        }
        notifyListeners("listeningState", data: ["state": "idle"])
    }

    private func finishPendingCall(rejectCode: String, message: String, error: Error? = nil, keepWarm: Bool) {
        cancelFirstBufferWatchdog()
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        removeTapOnly()
        if !keepWarm {
            teardownEngineAndSession()
        } else if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.prepare()
            enginePrepared = true
        }
        if let call = startCall {
            call.reject(message, rejectCode, error)
            startCall = nil
        }
        notifyListeners("listeningState", data: ["state": "idle"])
    }

    private func teardownEngineAndSession() {
        cancelFirstBufferWatchdog()
        if audioEngine.isRunning {
            audioEngine.stop()
        }
        removeTapOnly()
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        enginePrepared = false
        sessionPrepared = false
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

    // MARK: - Watchdog / Metrics

    private func scheduleFirstBufferWatchdog(generation: UInt64) {
        cancelFirstBufferWatchdog()
        let work = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            guard self.sessionGeneration == generation else { return }
            guard !self.receivedFirstBuffer else { return }
            self.finishPendingCall(
                rejectCode: "NO_AUDIO_BUFFER",
                message: "لم يصل أي صوت من الميكروفون خلال ثانية. تحقّق من الإذن أو سماعة Bluetooth وأعد المحاولة.",
                keepWarm: true
            )
            self.notifyListeners("listeningState", data: ["state": "no_audio"])
        }
        firstBufferWatchdog = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: work)
    }

    private func cancelFirstBufferWatchdog() {
        firstBufferWatchdog?.cancel()
        firstBufferWatchdog = nil
    }

    private func notifyLatency(event: String, extra: [String: Any] = [:]) {
        var payload: [String: Any] = ["event": event, "t": CFAbsoluteTimeGetCurrent()]
        for (k, v) in extra { payload[k] = v }
        notifyListeners("latency", data: payload)
        NSLog("[MajlisSpeech][latency] %@ %@", event, String(describing: extra))
    }

    private func msSince(_ start: CFAbsoluteTime) -> Double {
        max(0, (CFAbsoluteTimeGetCurrent() - start) * 1000.0)
    }

    private func msBetween(_ a: CFAbsoluteTime, _ b: CFAbsoluteTime) -> Double {
        guard a > 0, b > 0 else { return -1 }
        return max(0, (b - a) * 1000.0)
    }

    private static func rmsLevel(_ buffer: AVAudioPCMBuffer) -> Double {
        guard let channel = buffer.floatChannelData?[0] else { return 0 }
        let n = Int(buffer.frameLength)
        guard n > 0 else { return 0 }
        var sum: Float = 0
        let step = max(1, n / 256)
        var count = 0
        var i = 0
        while i < n {
            let s = channel[i]
            sum += s * s
            count += 1
            i += step
        }
        guard count > 0 else { return 0 }
        let rms = sqrt(sum / Float(count))
        // ضغط لوغاريتمي تقريبي 0…1
        let db = 20 * log10(max(rms, 1e-7))
        let normalized = max(0, min(1, (db + 50) / 50))
        return Double(normalized)
    }

    // MARK: - Interruptions

    private func handleMediaServicesReset() {
        NSLog("[MajlisSpeech] media services reset — tearing down recognition session")
        enginePrepared = false
        sessionPrepared = false
        tapInstalled = false
        finishPendingCall(
            rejectCode: "MEDIA_SERVICES_RESET",
            message: "أُعيد ضبط خدمات الصوت في النظام — أعد المحاولة",
            keepWarm: false
        )
        notifyListeners("audioSessionError", data: [
            "op": "media_services_reset",
            "message": "AVAudioSession media services were reset",
        ])
    }

    private func handleInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }
        if type == .began {
            finishPendingCall(
                rejectCode: "AUDIO_SESSION_FAILED",
                message: "قاطعت مكالمة أو Siri جلسة التسميع — أعد المحاولة",
                keepWarm: true
            )
            notifyListeners("audioInterruption", data: ["type": "began"])
        } else {
            sessionPrepared = false
            notifyListeners("audioInterruption", data: ["type": "ended"])
        }
    }

    private func handleRouteChange(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt
        else { return }
        notifyListeners("audioRouteChange", data: ["reason": reasonValue])
        // تغيّر المسار (AirPods…) قد يُبطل صيغة المدخل — أعد التحضير في الجلسة التالية
        if reasonValue == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue
            || reasonValue == AVAudioSession.RouteChangeReason.newDeviceAvailable.rawValue {
            enginePrepared = false
            if tapInstalled {
                removeTapOnly()
            }
        }
    }

    private static func classifyRecognitionError(_ error: NSError) -> String {
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
