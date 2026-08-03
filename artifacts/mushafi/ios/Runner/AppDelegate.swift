import UIKit
import Flutter
import AVFoundation

@main
@objc class AppDelegate: FlutterAppDelegate {
  private let methodChannelName = "tasmee3_pcm_audio/methods"
  private let eventChannelName = "tasmee3_pcm_audio/events"

  private var audioEngine: AVAudioEngine?
  private var eventSink: FlutterEventSink?
  private var isRecording: Bool = false

  private var targetSampleRate: Double = 16000
  private var targetChannels: AVAudioChannelCount = 1
  private var chunkBuffer = Data()
  private var chunkSizeBytes: Int = 3200

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    if let controller = window?.rootViewController as? FlutterViewController {
      let methodChannel = FlutterMethodChannel(
        name: methodChannelName,
        binaryMessenger: controller.binaryMessenger
      )

      methodChannel.setMethodCallHandler { [weak self] call, result in
        guard let self = self else {
          result(FlutterError(code: "NO_SELF", message: "AppDelegate unavailable", details: nil))
          return
        }

        switch call.method {
        case "isAvailable":
          self.checkMicrophoneAvailability(result: result)

        case "start":
          let args = call.arguments as? [String: Any]
          let sampleRate = args?["sampleRate"] as? Int ?? 16000
          let channels = args?["channels"] as? Int ?? 1
          let chunkSize = args?["chunkSizeBytes"] as? Int ?? 3200

          self.startPcmRecording(
            sampleRate: sampleRate,
            channels: channels,
            chunkSizeBytes: chunkSize,
            result: result
          )

        case "stop":
          self.stopPcmRecording()
          result(nil)

        default:
          result(FlutterMethodNotImplemented)
        }
      }

      let eventChannel = FlutterEventChannel(
        name: eventChannelName,
        binaryMessenger: controller.binaryMessenger
      )

      eventChannel.setStreamHandler(PcmAudioStreamHandler(
        onListen: { [weak self] sink in
          self?.eventSink = sink
        },
        onCancel: { [weak self] in
          self?.eventSink = nil
        }
      ))
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func checkMicrophoneAvailability(result: @escaping FlutterResult) {
    let session = AVAudioSession.sharedInstance()

    switch session.recordPermission {
    case .granted:
      result(true)

    case .denied:
      result(false)

    case .undetermined:
      session.requestRecordPermission { granted in
        DispatchQueue.main.async {
          result(granted)
        }
      }

    @unknown default:
      result(false)
    }
  }

  private func startPcmRecording(
    sampleRate: Int,
    channels: Int,
    chunkSizeBytes: Int,
    result: @escaping FlutterResult
  ) {
    if isRecording {
      result(nil)
      return
    }

    self.targetSampleRate = Double(sampleRate)
    self.targetChannels = AVAudioChannelCount(max(1, channels))
    self.chunkSizeBytes = max(640, chunkSizeBytes)
    self.chunkBuffer = Data()

    let session = AVAudioSession.sharedInstance()

    do {
      try session.setCategory(
        .record,
        mode: .measurement,
        options: [.duckOthers]
      )

      try session.setPreferredSampleRate(Double(sampleRate))
      try session.setPreferredInputNumberOfChannels(max(1, channels))
      try session.setActive(true)

      let engine = AVAudioEngine()
      self.audioEngine = engine

      let inputNode = engine.inputNode
      let inputFormat = inputNode.inputFormat(forBus: 0)

      guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
        result(FlutterError(
          code: "FORMAT_ERROR",
          message: "Invalid input audio format (sampleRate/channels)",
          details: nil
        ))
        return
      }

      guard let targetFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: Double(sampleRate),
        channels: AVAudioChannelCount(max(1, channels)),
        interleaved: true
      ) else {
        result(FlutterError(
          code: "FORMAT_ERROR",
          message: "Could not create target PCM format",
          details: nil
        ))
        return
      }

      guard let converter = AVAudioConverter(
        from: inputFormat,
        to: targetFormat
      ) else {
        result(FlutterError(
          code: "CONVERTER_ERROR",
          message: "Could not create AVAudioConverter",
          details: nil
        ))
        return
      }

      inputNode.removeTap(onBus: 0)

      inputNode.installTap(
        onBus: 0,
        bufferSize: 1024,
        format: inputFormat
      ) { [weak self] buffer, _ in
        guard let self = self else { return }

        self.convertAndEmit(
          buffer: buffer,
          converter: converter,
          targetFormat: targetFormat
        )
      }

      try engine.start()
      isRecording = true
      result(nil)

    } catch {
      isRecording = false
      audioEngine = nil
      result(FlutterError(
        code: "START_ERROR",
        message: error.localizedDescription,
        details: nil
      ))
    }
  }

  private func convertAndEmit(
    buffer: AVAudioPCMBuffer,
    converter: AVAudioConverter,
    targetFormat: AVAudioFormat
  ) {
    guard isRecording else { return }

    let ratio = targetFormat.sampleRate / buffer.format.sampleRate
    let targetFrameCapacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 32

    guard let convertedBuffer = AVAudioPCMBuffer(
      pcmFormat: targetFormat,
      frameCapacity: targetFrameCapacity
    ) else {
      return
    }

    var error: NSError?
    var didProvideInput = false

    let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
      if didProvideInput {
        outStatus.pointee = .noDataNow
        return nil
      }

      didProvideInput = true
      outStatus.pointee = .haveData
      return buffer
    }

    let status = converter.convert(
      to: convertedBuffer,
      error: &error,
      withInputFrom: inputBlock
    )

    if error != nil || status == .error {
      return
    }

    guard let data = pcmData(from: convertedBuffer), !data.isEmpty else {
      return
    }

    appendAndEmitChunks(data)
  }

  private func pcmData(from buffer: AVAudioPCMBuffer) -> Data? {
    guard buffer.frameLength > 0 else {
      return nil
    }

    guard let audioBuffer = buffer.audioBufferList.pointee.mBuffers.mData else {
      return nil
    }

    let byteSize = Int(buffer.audioBufferList.pointee.mBuffers.mDataByteSize)
    guard byteSize > 0 else {
      return nil
    }

    return Data(bytes: audioBuffer, count: byteSize)
  }

  private func appendAndEmitChunks(_ data: Data) {
    chunkBuffer.append(data)

    while chunkBuffer.count >= chunkSizeBytes {
      let chunk = chunkBuffer.prefix(chunkSizeBytes)
      chunkBuffer.removeFirst(chunkSizeBytes)

      let typedData = FlutterStandardTypedData(bytes: Data(chunk))

      DispatchQueue.main.async { [weak self] in
        self?.eventSink?(typedData)
      }
    }
  }

  private func stopPcmRecording() {
    guard isRecording else {
      return
    }

    isRecording = false

    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil

    if !chunkBuffer.isEmpty {
      let typedData = FlutterStandardTypedData(bytes: chunkBuffer)

      DispatchQueue.main.async { [weak self] in
        self?.eventSink?(typedData)
      }

      chunkBuffer.removeAll()
    }

    do {
      try AVAudioSession.sharedInstance().setActive(
        false,
        options: .notifyOthersOnDeactivation
      )
    } catch {
      // Ignore session deactivation error.
    }
  }
}

final class PcmAudioStreamHandler: NSObject, FlutterStreamHandler {
  private let onListenCallback: (FlutterEventSink?) -> Void
  private let onCancelCallback: () -> Void

  init(
    onListen: @escaping (FlutterEventSink?) -> Void,
    onCancel: @escaping () -> Void
  ) {
    self.onListenCallback = onListen
    self.onCancelCallback = onCancel
  }

  func onListen(
    withArguments arguments: Any?,
    eventSink events: @escaping FlutterEventSink
  ) -> FlutterError? {
    onListenCallback(events)
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    onCancelCallback()
    return nil
  }
}
