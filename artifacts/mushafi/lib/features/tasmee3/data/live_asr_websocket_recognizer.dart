import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../domain/live_asr_message.dart';
import '../domain/live_audio_level.dart';
import 'audio_quality_monitor.dart';
import 'quran_speech_recognizer.dart';

/// Optional live WebSocket ASR scaffold.
/// Receives ready/partial/final messages when the server sends them.
/// Does not replace HTTP Forced Alignment `/transcribe` for final accuracy.
class LiveAsrWebSocketRecognizer implements QuranSpeechRecognizer {
  final Uri websocketUri;
  final String? apiKey;

  LiveAsrWebSocketRecognizer({
    required this.websocketUri,
    this.apiKey,
  });

  final AudioRecorder _recorder = AudioRecorder();
  final AudioQualityMonitor _qualityMonitor = AudioQualityMonitor();

  final StreamController<RecognizedSegment> _segmentsController =
      StreamController<RecognizedSegment>.broadcast();

  WebSocketChannel? _channel;
  StreamSubscription? _channelSub;

  String? _recordingPath;
  bool _initialized = false;
  bool _isStopping = false;

  @override
  Future<bool> initialize() async {
    final hasPermission = await _recorder.hasPermission();
    _initialized = hasPermission;
    return hasPermission;
  }

  @override
  Stream<RecognizedSegment> listen() {
    unawaited(_start());
    return _segmentsController.stream;
  }

  Future<void> _start() async {
    if (!_initialized) {
      final ok = await initialize();

      if (!ok) {
        _segmentsController.addError(
          StateError('لم يتم منح صلاحية الميكروفون.'),
        );
        return;
      }
    }

    _isStopping = false;

    try {
      await _connectWebSocket();
      await _startRecordingForLive();
    } catch (e) {
      if (!_isStopping) {
        _segmentsController.addError(e);
      }
    }
  }

  Future<void> _connectWebSocket() async {
    final headers = <String, dynamic>{};

    if (apiKey != null && apiKey!.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer $apiKey';
    }

    final socket = await WebSocket.connect(
      websocketUri.toString(),
      headers: headers.isEmpty ? null : headers,
    );

    _channel = IOWebSocketChannel(socket);

    _channel!.sink.add(
      jsonEncode({
        'type': 'start',
        'language': 'ar',
      }),
    );

    await _channelSub?.cancel();

    _channelSub = _channel!.stream.listen(
      (event) {
        _handleSocketMessage(event);
      },
      onError: (error) {
        if (!_isStopping) {
          _segmentsController.addError(error);
        }
      },
      onDone: () {
        if (!_isStopping) {
          _segmentsController.addError(
            StateError('تم إغلاق اتصال WebSocket.'),
          );
        }
      },
    );
  }

  Future<void> _startRecordingForLive() async {
    final dir = await getTemporaryDirectory();
    final path =
        '${dir.path}/tasmee3_live_${DateTime.now().millisecondsSinceEpoch}.m4a';

    _recordingPath = path;

    _qualityMonitor.start();

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 16000,
        numChannels: 1,
      ),
      path: path,
    );

    // Note:
    // The current record package writes to a file and does not always expose
    // a raw audio stream on every platform. This recognizer opens WebSocket
    // and consumes partials if the server sends them. True audio chunk upload
    // needs a later stream API. Do not crash if partials never arrive.
    unawaited(_amplitudeLoop());
  }

  void _handleSocketMessage(dynamic event) {
    try {
      final decoded = jsonDecode(event as String) as Map<String, dynamic>;
      final message = LiveAsrMessage.fromJson(decoded);

      if (message.type == LiveAsrMessageType.error) {
        _segmentsController.addError(
          StateError(message.errorMessage ?? 'خطأ في live ASR'),
        );
        return;
      }

      if (message.type == LiveAsrMessageType.partial ||
          message.type == LiveAsrMessageType.finalResult) {
        _segmentsController.add(
          RecognizedSegment(
            text: message.text,
            confidence: message.confidence,
            isFinal: message.type == LiveAsrMessageType.finalResult,
            timestamp: DateTime.now(),
            words: message.words,
          ),
        );
      }
    } catch (e) {
      if (!_isStopping) {
        _segmentsController.addError(e);
      }
    }
  }

  Future<void> _amplitudeLoop() async {
    while (await _recorder.isRecording()) {
      try {
        final amplitude = await _recorder.getAmplitude();

        final current = amplitude.current;
        final normalized = ((current + 60) / 60).clamp(0, 1).toDouble();

        _qualityMonitor.addAmplitude(normalized);
      } catch (_) {}

      await Future<void>.delayed(const Duration(milliseconds: 180));
    }
  }

  @override
  Stream<LiveAudioLevel> get audioLevels => _qualityMonitor.levels;

  @override
  Future<void> stop() async {
    _isStopping = true;

    try {
      _channel?.sink.add(jsonEncode({'type': 'stop'}));
    } catch (_) {}

    try {
      await _recorder.stop();
    } catch (_) {}

    try {
      await _channelSub?.cancel();
    } catch (_) {}

    try {
      await _channel?.sink.close();
    } catch (_) {}

    final path = _recordingPath;

    if (path != null) {
      try {
        final file = File(path);

        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    }
  }
}
