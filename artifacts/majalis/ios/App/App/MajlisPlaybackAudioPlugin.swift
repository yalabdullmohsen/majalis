import AVFoundation
import Capacitor
import MediaPlayer
import UIKit

/// AVAudioSession + Now Playing bridge for Capacitor WebView Quran/lesson audio.
/// - `.playback` only when JS requests continuous playback (never at cold launch)
/// - Keeps session active across background / lock so HTML5 audio is not suspended
/// - Publishes MPNowPlayingInfoCenter + MPRemoteCommandCenter for Control Center / Lock Screen
@objc(MajlisPlaybackAudioPlugin)
public class MajlisPlaybackAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisPlaybackAudioPlugin"
    public let jsName = "MajlisPlaybackAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enablePlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enableRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deactivate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentMode", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setNowPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearNowPlaying", returnType: CAPPluginReturnPromise),
    ]

    private var observersInstalled = false
    private var mode: String = "inactive"
    private var mediaResetObserver: NSObjectProtocol?
    private var lifecycleObservers: [NSObjectProtocol] = []
    private var remoteCommandsInstalled = false
    private var nowPlayingTitle: String = "تلاوة القرآن"
    private var nowPlayingArtist: String = "سُنّة"
    private var nowPlayingAlbum: String = "سُنّة"

    public override func load() {
        super.load()
        installSessionObserversIfNeeded()
        installLifecycleObservers()
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
        for obs in lifecycleObservers {
            NotificationCenter.default.removeObserver(obs)
        }
        NotificationCenter.default.removeObserver(self)
    }

    @objc func enablePlayback(_ call: CAPPluginCall) {
        if let title = call.getString("title"), !title.isEmpty {
            nowPlayingTitle = title
        }
        if let artist = call.getString("artist"), !artist.isEmpty {
            nowPlayingArtist = artist
        }
        if let album = call.getString("album"), !album.isEmpty {
            nowPlayingAlbum = album
        }
        do {
            try activatePlaybackSession()
            installRemoteCommandsIfNeeded()
            UIApplication.shared.beginReceivingRemoteControlEvents()
            publishNowPlaying(isPlaying: true)
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
            clearNowPlayingInfo()
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
            clearNowPlayingInfo()
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

    @objc func setNowPlaying(_ call: CAPPluginCall) {
        if let title = call.getString("title"), !title.isEmpty {
            nowPlayingTitle = title
        }
        if let artist = call.getString("artist"), !artist.isEmpty {
            nowPlayingArtist = artist
        }
        if let album = call.getString("album"), !album.isEmpty {
            nowPlayingAlbum = album
        }
        let playing = call.getBool("playing") ?? (mode == "playback")
        var elapsed: Double?
        var duration: Double?
        var rate: Float = 1
        if let e = call.getDouble("elapsed") { elapsed = e }
        if let d = call.getDouble("duration") { duration = d }
        if let r = call.getFloat("playbackRate") { rate = r }
        publishNowPlaying(
            isPlaying: playing,
            elapsed: elapsed,
            duration: duration,
            rate: rate
        )
        call.resolve(["ok": true])
    }

    @objc func clearNowPlaying(_ call: CAPPluginCall) {
        clearNowPlayingInfo()
        call.resolve(["ok": true])
    }

    private func activatePlaybackSession() throws {
        let session = AVAudioSession.sharedInstance()
        // Continuous media (Quran tilawa) — no duckOthers (that is for short SFX).
        try session.setCategory(
            .playback,
            mode: .default,
            options: [.allowAirPlay, .allowBluetoothA2DP]
        )
        try session.setActive(true, options: [])
    }

    private func installLifecycleObservers() {
        let center = NotificationCenter.default
        let names: [Notification.Name] = [
            Notification.Name("MajlisAppDidEnterBackground"),
            Notification.Name("MajlisAppWillResignActive"),
            UIApplication.didEnterBackgroundNotification,
            UIApplication.willResignActiveNotification,
        ]
        for name in names {
            let obs = center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.reassertPlaybackIfNeeded()
            }
            lifecycleObservers.append(obs)
        }
    }

    /// Re-assert .playback while tilawa is active so WKWebView HTML5 is not suspended.
    private func reassertPlaybackIfNeeded() {
        guard mode == "playback" else { return }
        do {
            try activatePlaybackSession()
            publishNowPlaying(isPlaying: true)
        } catch {
            NSLog("[MajlisPlayback] background reassert failed: %@", error.localizedDescription)
            notifyListeners("audioSessionError", data: [
                "op": "background_reassert",
                "message": error.localizedDescription,
            ])
        }
    }

    private func installRemoteCommandsIfNeeded() {
        guard !remoteCommandsInstalled else { return }
        remoteCommandsInstalled = true
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.isEnabled = true
        center.pauseCommand.isEnabled = true
        center.togglePlayPauseCommand.isEnabled = true
        center.nextTrackCommand.isEnabled = true
        center.previousTrackCommand.isEnabled = true
        center.stopCommand.isEnabled = true

        center.playCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "play"])
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "pause"])
            return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "toggle"])
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "next"])
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "previous"])
            return .success
        }
        center.stopCommand.addTarget { [weak self] _ in
            self?.notifyListeners("remoteCommand", data: ["action": "stop"])
            return .success
        }
    }

    private func publishNowPlaying(
        isPlaying: Bool,
        elapsed: Double? = nil,
        duration: Double? = nil,
        rate: Float = 1
    ) {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: nowPlayingTitle,
            MPMediaItemPropertyArtist: nowPlayingArtist,
            MPMediaItemPropertyAlbumTitle: nowPlayingAlbum,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? rate : 0,
        ]
        if let elapsed { info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = elapsed }
        if let duration { info[MPMediaItemPropertyPlaybackDuration] = duration }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func clearNowPlayingInfo() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
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
                    try activatePlaybackSession()
                    publishNowPlaying(isPlaying: true)
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
        if type == .began {
            publishNowPlaying(isPlaying: false)
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
