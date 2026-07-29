import AVFoundation
import Capacitor

/// Sets AVAudioSession to .playback so Quran/lesson HTMLAudioElement can continue
/// when the screen locks (UIBackgroundModes=audio already declared in Info.plist).
@objc(MajlisPlaybackAudioPlugin)
public class MajlisPlaybackAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisPlaybackAudioPlugin"
    public let jsName = "MajlisPlaybackAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enablePlayback", returnType: CAPPluginReturnPromise)
    ]

    @objc func enablePlayback(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.allowAirPlay, .allowBluetoothA2DP])
            try session.setActive(true, options: [])
            call.resolve(["ok": true])
        } catch {
            call.reject("audio_session_failed", error.localizedDescription, error)
        }
    }
}
