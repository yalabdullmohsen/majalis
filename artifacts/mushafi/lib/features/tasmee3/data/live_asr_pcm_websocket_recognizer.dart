import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../domain/live_asr_message.dart';
import '../domain/live_audio_level.dart';
import '../domain/pcm_audio_config.dart';
import 'audio_quality_monitor.dart';
import 'pcm_audio_stream_service.dart';
import 'quran_speech_recognizer.dart';

/// Live ASR via native PCM binary frames over WebSocket.
///
/// Falls back when [PcmAudioStreamService.isAvailable] is false
/// (permission denied or native PCM unavailable).
class LiveAsrPcmWebSocketRecognizer implements QuranSpeechRecognizer {
  final Uri websocketUri;
  final String? apiKey;
  final PcmAudioStreamService pcmService;
  final PcmAudioConfig config;
  final Duration partialTimeout;

  LiveAsrPcmWebSocketRecognizer({
    required this.websocketUri,
    required this.pcmService,
    this.apiKey,
    this.config = const PcmAudioConfig(),
    this.partialTimeout = const Duration(seconds: 8),
  });

  final AudioQualityMonitor _qualityMonitor = AudioQualityMonitor();

  final StreamController<RecognizedSegment> _segmentsController =
      StreamController<RecognizedSegment>.broadcast();

  WebSocketChannel? _channel;
  StreamSubscription? _channelSub;
  StreamSubscription? _pcmSub;

  bool _initialized = false;
  bool _isStopping = false;
  DateTime? _lastPartialAt;
  Timer? _watchdogTimer;

  @override
  Future<bool> initialize() async {
    try {
      _initialized = await pcmService.isAvailable();
      return _initialized;
    } catch (_) {
      _initialized = false;
      return false;
    }
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
          StateError(
            'Native PCM Streaming غير متاح على هذا الجهاز. عطّل خيار PCM أو استخدم WebSocket chunks أو الخادم العادي.',
          ),
        );
        return;
      }
    }

    _isStopping = false;
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

    await _pcmSub?.cancel();

    _pcmSub = pcmService.chunks.listen(
      (chunk) {
        if (_isStopping) {
          return;
        }

        _channel?.sink.add(chunk.bytes);

        _channel?.sink.add(
          jsonEncode({
            'type': 'pcmMeta',
            'sequence': chunk.sequence,
            'timestamp': chunk.timestamp.toIso8601String(),
          }),
        );

        _trackPseudoAudioLevel(chunk.bytes);
      },
      onError: (error) {
        if (!_isStopping) {
          _segmentsController.addError(error);
        }
      },
    );

    try {
      await pcmService.start(config);
    } catch (e) {
      if (!_isStopping) {
        _segmentsController.addError(e);
      }
      return;
    }

    _startWatchdog();
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
        'type': 'startPcm',
        'language': 'ar',
        'sampleRate': config.sampleRate,
        'channels': config.channels,
        'bitsPerSample': config.bitsPerSample,
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
            StateError('تم إغلاق اتصال WebSocket PCM.'),
          );
        }
      },
    );
  }

  void _handleSocketMessage(dynamic event) {
    try {
      if (event is! String) {
        return;
      }

      final decoded = jsonDecode(event) as Map<String, dynamic>;
      final message = LiveAsrMessage.fromJson(decoded);

      if (message.type == LiveAsrMessageType.error) {
        _segmentsController.addError(
          StateError(message.errorMessage ?? 'خطأ في PCM live ASR'),
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

  void _startWatchdog() {
    _watchdogTimer?.cancel();

    _watchdogTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (_isStopping) {
        return;
      }

      final last = _lastPartialAt;

      if (last == null) {
        return;
      }

      if (DateTime.now().difference(last) > partialTimeout) {
        _segmentsController.addError(
          StateError(
            'لم تصل نتائج مباشرة من PCM WebSocket خلال ${partialTimeout.inSeconds} ثوان.',
          ),
        );

        _watchdogTimer?.cancel();
      }
    });
  }

  void _trackPseudoAudioLevel(List<int> bytes) {
    if (bytes.isEmpty) {
      return;
    }

    final sample = bytes.take(500);
    var sum = 0;

    for (final byte in sample) {
      sum += byte.abs();
    }

    final average = sum / sample.length;
    final normalized = (average / 255).clamp(0, 1).toDouble();

    _qualityMonitor.addAmplitude(normalized);
  }

  @override
  Stream<LiveAudioLevel> get audioLevels => _qualityMonitor.levels;

  @override
  Future<void> stop() async {
    _isStopping = true;
    _watchdogTimer?.cancel();

    try {
      await pcmService.stop();
    } catch (_) {}

    try {
      await _pcmSub?.cancel();
    } catch (_) {}

    try {
      _channel?.sink.add(jsonEncode({'type': 'stopPcm'}));
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
