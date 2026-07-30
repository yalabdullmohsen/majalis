import AVFoundation
import Capacitor
import UIKit

/// AVAudioSession bridge for Capacitor WebView media.
/// - `.playback` only when Quran/lesson audio needs background continuation
/// - `.playAndRecord` / `.record` for speech/recitation plugins
/// Does NOT activate the session at app launch.
@objc(MajlisPlaybackAudioPlugin)
public class MajlisPlaybackAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisPlaybackAudioPlugin"
    public let jsName = "MajlisPlaybackAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enablePlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enableRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deactivate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentMode", returnType: CAPPluginReturnPromise)
    ]

    private var observersInstalled = false
    private var mode: String = "inactive"
    private var mediaResetObserver: NSObjectProtocol?

    public override func load() {
        super.load()
        installSessionObserversIfNeeded()
        mediaResetObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            self.mode = "inactive"
            self.notifyListeners("audioSessionError", data: [
                "op": "media_services_reset",
                "message": "AVAudioSession media services were reset",
            ])
        }
    }

    deinit {
        if let mediaResetObserver {
            NotificationCenter.default.removeObserver(mediaResetObserver)
        }
        NotificationCenter.default.removeObserver(self)
    }

    @objc func enablePlayback(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(
                .playback,
                mode: .spokenAudio,
                options: [.allowAirPlay, .allowBluetoothA2DP]
            )
            try session.setActive(true, options: [])
            mode = "playback"
            call.resolve(["ok": true, "mode": mode])
        } catch {
            call.reject(
                "تعذّر تفعيل جلسة التشغيل: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
        }
    }

    /// Switch session for mic / speech recognition without fighting `.playback`.
    @objc func enableRecording(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(
                .playAndRecord,
                mode: .measurement,
                options: [.duckOthers, .defaultToSpeaker, .allowBluetooth]
            )
            try session.setActive(true, options: [])
            mode = "recording"
            call.resolve(["ok": true, "mode": mode])
        } catch {
            call.reject(
                "تعذّر تفعيل جلسة التسجيل: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
        }
    }

    @objc func deactivate(_ call: CAPPluginCall) {
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            mode = "inactive"
            call.resolve(["ok": true, "mode": mode])
        } catch {
            call.reject(
                "تعذّر إيقاف جلسة الصوت: \(error.localizedDescription)",
                "AUDIO_SESSION_FAILED",
                error
            )
        }
    }

    @objc func currentMode(_ call: CAPPluginCall) {
        call.resolve(["mode": mode])
    }

    private func installSessionObserversIfNeeded() {
        guard !observersInstalled else { return }
        observersInstalled = true
        let center = NotificationCenter.default
        center.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
        center.addObserver(
            self,
            selector: #selector(handleRouteChange(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance()
        )
    }

    @objc private func handleInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        var payload: [String: Any] = ["type": type == .began ? "began" : "ended", "mode": mode]
        if type == .ended,
           let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            let shouldResume = options.contains(.shouldResume)
            payload["shouldResume"] = shouldResume
            if shouldResume && mode == "playback" {
                do {
                    try AVAudioSession.sharedInstance().setActive(true, options: [])
                } catch {
                    NSLog("[MajlisPlayback] resume after interruption failed: %@", error.localizedDescription)
                    payload["resumeError"] = error.localizedDescription
                    notifyListeners("audioSessionError", data: [
                        "op": "resume_after_interruption",
                        "message": error.localizedDescription,
                    ])
                }
            }
        }
        notifyListeners("audioInterruption", data: payload)
    }

    @objc private func handleRouteChange(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
        else { return }
        notifyListeners("audioRouteChange", data: ["reason": reason.rawValue])
    }
}
