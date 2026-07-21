import Foundation
import Capacitor
import AVFoundation

/// جسر Capacitor لالتقاط صوت خام (PCM 16kHz mono) وبثّه مقاطعَ (chunks)
/// مُرمَّزة Base64 إلى طبقة JS — يُستخدَم حصرًا لمستوى "إتقان التجويد" في
/// ميزة "اختبار التسميع بالذكاء الاصطناعي" حين يتصل مزوّد ASR خادمي حقيقي
/// (src/lib/recitation-ai/providers/server-provider.ts) القادر على تحليل
/// فونيمي — بخلاف مسار "حفظ فقط" الذي يستخدم
/// MajlisSpeechRecognitionPlugin.swift القائم فعلاً (SFSpeechRecognizer،
/// نص فقط، لا صوت خام).
///
/// ⚠️ حالة هذا الملف: **مكتوب وغير مُختبَر بناء Xcode فعليًا في هذه
/// الجلسة** (قيد قائم من المالك بعدم تشغيل Xcode/cap sync مجددًا هذه
/// الجلسة). لا مستهلك حالي فعلي له في التطبيق — ServerQuranASRProvider
/// (JS) يرفض كل استدعاء بخطأ NOT_CONFIGURED صراحة، فهذا الجسر بنية تحتية
/// جاهزة لتفعيل مستقبلي لا مسار نشط اليوم. راجع التقرير النهائي.
///
/// بنفس نمط MajlisSpeechRecognitionPlugin.swift: AVAudioEngine مباشرة،
/// بلا حزم Capacitor مجتمعية (CocoaPods)، Swift Package Manager حصرًا.
@objc(RecitationAudioCapturePlugin)
public class RecitationAudioCapturePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RecitationAudioCapturePlugin"
    public let jsName = "RecitationAudioCapture"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startCapture", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopCapture", returnType: CAPPluginReturnPromise)
    ]

    private let audioEngine = AVAudioEngine()
    private var isCapturing = false
    private let targetSampleRate: Double = 16_000

    @objc func requestPermission(_ call: CAPPluginCall) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                call.resolve(["granted": granted])
            }
        }
    }

    /// يبدأ الالتقاط ويبث مقاطع PCM16 أحادية 16kHz عبر حدث "audioChunk"
    /// (base64 + طابع زمني بالمللي ثانية) — لا تسجيل لملف، لا رفع تلقائي؛
    /// طبقة JS (AudioCaptureService المستقبلية) هي من تقرّر الإرسال بعد
    /// موافقة صريحة (القسم 12).
    @objc func startCapture(_ call: CAPPluginCall) {
        if isCapturing {
            call.reject("جلسة التقاط سابقة لا تزال قائمة")
            return
        }

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.reject("تعذّر تفعيل جلسة الصوت: \(error.localizedDescription)")
            return
        }

        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        guard let targetFormat = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: targetSampleRate,
            channels: 1,
            interleaved: true
        ) else {
            call.reject("تعذّر بناء صيغة الصوت الهدف (16kHz mono PCM16)")
            return
        }

        guard let converter = AVAudioConverter(from: inputFormat, to: targetFormat) else {
            call.reject("تعذّر بناء محوّل الصوت")
            return
        }

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
            guard let self = self else { return }

            let outputFrameCapacity = AVAudioFrameCount(
                Double(buffer.frameLength) * (self.targetSampleRate / inputFormat.sampleRate) + 1
            )
            guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outputFrameCapacity) else { return }

            var error: NSError?
            let status = converter.convert(to: outputBuffer, error: &error) { _, outStatus in
                outStatus.pointee = .haveData
                return buffer
            }

            guard status != .error, error == nil, let channelData = outputBuffer.int16ChannelData else { return }

            let frameCount = Int(outputBuffer.frameLength)
            let data = Data(bytes: channelData[0], count: frameCount * MemoryLayout<Int16>.size)
            let base64 = data.base64EncodedString()

            self.notifyListeners("audioChunk", data: [
                "pcm16Base64": base64,
                "atMs": Int(Date().timeIntervalSince1970 * 1000),
            ])
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
            isCapturing = true
            call.resolve()
        } catch {
            inputNode.removeTap(onBus: 0)
            call.reject("تعذّر بدء الالتقاط: \(error.localizedDescription)")
        }
    }

    @objc func stopCapture(_ call: CAPPluginCall) {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        isCapturing = false
        call.resolve()
    }
}
