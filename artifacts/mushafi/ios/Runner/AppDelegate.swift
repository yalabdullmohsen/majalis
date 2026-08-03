import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private let methodChannelName = "tasmee3_pcm_audio/methods"
  private let eventChannelName = "tasmee3_pcm_audio/events"

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // TODO: Implement AVAudioEngine PCM streaming for iOS.
    // Until then isAvailable returns false so Flutter uses m4a/HTTP/STT fallback.
    if let controller = window?.rootViewController as? FlutterViewController {
      let methodChannel = FlutterMethodChannel(
        name: methodChannelName,
        binaryMessenger: controller.binaryMessenger
      )

      methodChannel.setMethodCallHandler { call, result in
        switch call.method {
        case "isAvailable":
          result(false)
        case "start", "stop":
          result(
            FlutterError(
              code: "IOS_PCM_TODO",
              message: "iOS PCM streaming requires AVAudioEngine implementation",
              details: nil
            )
          )
        default:
          result(FlutterMethodNotImplemented)
        }
      }

      let eventChannel = FlutterEventChannel(
        name: eventChannelName,
        binaryMessenger: controller.binaryMessenger
      )

      eventChannel.setStreamHandler(PcmUnavailableStreamHandler())
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

/// Placeholder EventChannel handler until AVAudioEngine PCM is implemented.
private class PcmUnavailableStreamHandler: NSObject, FlutterStreamHandler {
  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    return FlutterError(
      code: "IOS_PCM_TODO",
      message: "iOS PCM streaming is not implemented yet",
      details: nil
    )
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    return nil
  }
}
