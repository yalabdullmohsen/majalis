import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../domain/live_asr_message.dart';
import '../domain/live_audio_level.dart';
import '../domain/live_streaming_config.dart';
import 'audio_quality_monitor.dart';
import 'quran_speech_recognizer.dart';

/// Live WebSocket ASR using short recorded chunks (m4a base64).
///
/// TODO: Replace chunk-file loop with native PCM audio stream for production.
class LiveAsrWebSocketRecognizer implements QuranSpeechRecognizer {
  final Uri websocketUri;
  final String? apiKey;
  final LiveStreamingConfig config;

  LiveAsrWebSocketRecognizer({
    required this.websocketUri,
    this.apiKey,
    this.config = const LiveStreamingConfig(),
  });

  final AudioRecorder _recorder = AudioRecorder();
  final AudioQualityMonitor _qualityMonitor = AudioQualityMonitor();

  final StreamController<RecognizedSegment> _segmentsController =
      StreamController<RecognizedSegment>.broadcast();

  WebSocketChannel? _channel;
  StreamSubscription? _channelSub;

  bool _initialized = false;
  bool _isStopping = false;
  bool _isStreaming = false;

  int _sequence = 0;
  DateTime? _lastPartialAt;
  Timer? _fallbackTimer;

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
    _isStreaming = true;
    _sequence = 0;
    _lastPartialAt = DateTime.now();

    try {
      await _connectWebSocket();
    } catch (e) {
      if (!_isStopping) {
        _segmentsController.addError(e);
      }
      return;
    }

    _qualityMonitor.start();
    _startFallbackWatchdog();
    unawaited(_streamChunkLoop());
    unawaited(_amplitudeLoop());
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
        'sampleRate': config.sampleRate,
        'channels': config.channels,
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

  Future<void> _streamChunkLoop() async {
    while (_isStreaming && !_isStopping) {
      final file = await _recordShortChunk();

      if (file == null) {
        continue;
      }

      try {
        final bytes = await file.readAsBytes();

        if (bytes.isNotEmpty && !_isStopping) {
          _sequence++;

          _channel?.sink.add(
            jsonEncode({
              'type': 'audioChunk',
              'sequence': _sequence,
              'format': 'm4a',
              'data': base64Encode(bytes),
            }),
          );
        }
      } catch (e) {
        if (!_isStopping) {
          _segmentsController.addError(e);
        }
      } finally {
        try {
          if (await file.exists()) {
            await file.delete();
          }
        } catch (_) {}
      }
    }
  }

  Future<File?> _recordShortChunk() async {
    try {
      final dir = await getTemporaryDirectory();
      final path =
          '${dir.path}/tasmee3_live_chunk_${DateTime.now().microsecondsSinceEpoch}.m4a';

      await _recorder.start(
        RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: config.bitRate,
          sampleRate: config.sampleRate,
          numChannels: config.channels,
        ),
        path: path,
      );

      await Future<void>.delayed(config.chunkDuration);

      if (_isStopping || !_isStreaming) {
        try {
          await _recorder.stop();
        } catch (_) {}
        return null;
      }

      final stoppedPath = await _recorder.stop();
      final finalPath = stoppedPath ?? path;

      final file = File(finalPath);

      if (!await file.exists()) {
        return null;
      }

      return file;
    } catch (e) {
      if (!_isStopping) {
        _segmentsController.addError(e);
      }

      return null;
    }
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
        _lastPartialAt = DateTime.now();

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

  void _startFallbackWatchdog() {
    _fallbackTimer?.cancel();

    _fallbackTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (_isStopping || !_isStreaming) {
        return;
      }

      final last = _lastPartialAt;

      if (last == null) {
        return;
      }

      final elapsed = DateTime.now().difference(last);

      if (elapsed > config.partialTimeout) {
        _segmentsController.addError(
          StateError(
            'لم تصل نتائج مباشرة من WebSocket خلال ${config.partialTimeout.inSeconds} ثوان.',
          ),
        );

        _fallbackTimer?.cancel();
      }
    });
  }

  Future<void> _amplitudeLoop() async {
    while (_isStreaming && !_isStopping) {
      try {
        if (await _recorder.isRecording()) {
          final amplitude = await _recorder.getAmplitude();
          final current = amplitude.current;
          final normalized = ((current + 60) / 60).clamp(0, 1).toDouble();
          _qualityMonitor.addAmplitude(normalized);
        }
      } catch (_) {}

      await Future<void>.delayed(const Duration(milliseconds: 220));
    }
  }

  @override
  Stream<LiveAudioLevel> get audioLevels => _qualityMonitor.levels;

  @override
  Future<void> stop() async {
    _isStopping = true;
    _isStreaming = false;

    _fallbackTimer?.cancel();

    try {
      if (await _recorder.isRecording()) {
        await _recorder.stop();
      }
    } catch (_) {}

    try {
      _channel?.sink.add(
        jsonEncode({
          'type': 'stop',
          'sequence': _sequence,
        }),
      );
    } catch (_) {}

    await Future<void>.delayed(const Duration(milliseconds: 250));

    try {
      await _channelSub?.cancel();
    } catch (_) {}

    try {
      await _channel?.sink.close();
    } catch (_) {}
  }
}
