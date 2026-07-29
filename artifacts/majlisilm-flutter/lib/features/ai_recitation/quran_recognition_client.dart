import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:web_socket_channel/web_socket_channel.dart';

/// Partial / final transcript event from either WebSocket ASR or on-device STT.
class RecognitionTranscript {
  const RecognitionTranscript({
    required this.text,
    required this.isFinal,
    this.confidence,
  });

  final String text;
  final bool isFinal;
  final double? confidence;
}

/// Streams PCM chunks to an optional WebSocket ASR endpoint and/or listens
/// via on-device [speech_to_text] so the UI works without a remote server.
class QuranRecognitionClient {
  QuranRecognitionClient({
    this.websocketUrl,
    this.localeId = 'ar_SA',
    stt.SpeechToText? speech,
  }) : _speech = speech ?? stt.SpeechToText();

  /// e.g. `wss://asr.example.com/v1/stream?sample_rate=16000`
  final Uri? websocketUrl;
  final String localeId;
  final stt.SpeechToText _speech;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _wsSub;
  StreamSubscription<Uint8List>? _pcmSub;
  bool _speechReady = false;
  bool _listeningLocal = false;
  bool _sessionOpen = false;

  final StreamController<RecognitionTranscript> _transcriptController =
      StreamController<RecognitionTranscript>.broadcast();
  final StreamController<String> _errorController =
      StreamController<String>.broadcast();

  Stream<RecognitionTranscript> get transcriptStream =>
      _transcriptController.stream;
  Stream<String> get errorStream => _errorController.stream;

  bool get usesWebsocket => websocketUrl != null;
  bool get isSessionOpen => _sessionOpen;

  Future<void> openSession({required Stream<Uint8List> pcmChunkStream}) async {
    await closeSession();
    _sessionOpen = true;

    if (websocketUrl != null) {
      await _openWebsocket(pcmChunkStream);
    }

    // Always arm on-device STT as a parallel (or sole) transcript source so
    // demos and offline devices still receive live Arabic recognition.
    await _startLocalSpeech();
  }

  Future<void> _openWebsocket(Stream<Uint8List> pcmChunkStream) async {
    try {
      _channel = WebSocketChannel.connect(websocketUrl!);
      await _channel!.ready;

      // Handshake: announce PCM format expected by the server.
      _channel!.sink.add(
        jsonEncode({
          'type': 'start',
          'encoding': 'pcm_s16le',
          'sample_rate': 16000,
          'channels': 1,
          'language': localeId,
        }),
      );

      _wsSub = _channel!.stream.listen(
        _onWebsocketMessage,
        onError: (Object e) {
          _errorController.add('خطأ في اتصال التعرف السحابي: $e');
        },
        onDone: () {
          debugPrint('QuranRecognitionClient WebSocket closed');
        },
        cancelOnError: false,
      );

      _pcmSub = pcmChunkStream.listen(
        (chunk) {
          final ch = _channel;
          if (ch == null) return;
          // Binary PCM frame — servers that prefer base64 can still decode
          // this raw payload when framed by the preceding JSON "start".
          ch.sink.add(chunk);
        },
        onError: (Object e) {
          _errorController.add('تعذّر إرسال مقطع صوتي: $e');
        },
      );
    } catch (e) {
      _errorController.add(
        'تعذّر الاتصال بخادم التعرف ($websocketUrl): $e — سيتم الاعتماد على التعرف المحلي.',
      );
      await _wsSub?.cancel();
      _wsSub = null;
      await _pcmSub?.cancel();
      _pcmSub = null;
      try {
        await _channel?.sink.close();
      } catch (_) {}
      _channel = null;
    }
  }

  void _onWebsocketMessage(dynamic message) {
    try {
      final Map<String, dynamic> json;
      if (message is String) {
        json = jsonDecode(message) as Map<String, dynamic>;
      } else if (message is List<int>) {
        json = jsonDecode(utf8.decode(message)) as Map<String, dynamic>;
      } else {
        return;
      }

      final type = json['type'] as String? ?? 'transcript';
      if (type == 'error') {
        _errorController.add(json['message'] as String? ?? 'خطأ من خادم التعرف');
        return;
      }

      final text = (json['text'] as String?) ??
          (json['transcript'] as String?) ??
          (json['result'] as String?) ??
          '';
      if (text.trim().isEmpty) return;

      final isFinal = json['is_final'] == true ||
          json['isFinal'] == true ||
          type == 'final';
      final confidence = (json['confidence'] as num?)?.toDouble();

      _transcriptController.add(
        RecognitionTranscript(
          text: text,
          isFinal: isFinal,
          confidence: confidence,
        ),
      );
    } catch (e) {
      debugPrint('QuranRecognitionClient parse error: $e');
    }
  }

  Future<void> _startLocalSpeech() async {
    try {
      _speechReady = await _speech.initialize(
        onError: (e) => _errorController.add(e.errorMsg),
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            _listeningLocal = false;
          }
        },
      );
    } catch (e) {
      _speechReady = false;
      _errorController.add('التعرف الصوتي المحلي غير متاح: $e');
      return;
    }

    if (!_speechReady) {
      _errorController.add('تعذّر تهيئة التعرف الصوتي على هذا الجهاز.');
      return;
    }

    _listeningLocal = true;
    await _speech.listen(
      onResult: (result) {
        if (!_sessionOpen) return;
        _transcriptController.add(
          RecognitionTranscript(
            text: result.recognizedWords,
            isFinal: result.finalResult,
            confidence: result.confidence >= 0 ? result.confidence : null,
          ),
        );
      },
      listenOptions: stt.SpeechListenOptions(
        localeId: localeId,
        partialResults: true,
        cancelOnError: false,
        listenMode: stt.ListenMode.dictation,
        listenFor: const Duration(minutes: 5),
        pauseFor: const Duration(seconds: 8),
      ),
    );
  }

  Future<void> pauseLocalSpeech() async {
    if (_listeningLocal) {
      await _speech.stop();
      _listeningLocal = false;
    }
  }

  Future<void> resumeLocalSpeech() async {
    if (!_sessionOpen) return;
    if (_listeningLocal) return;
    await _startLocalSpeech();
  }

  Future<void> closeSession() async {
    _sessionOpen = false;
    _listeningLocal = false;
    await _pcmSub?.cancel();
    _pcmSub = null;
    await _wsSub?.cancel();
    _wsSub = null;
    try {
      _channel?.sink.add(jsonEncode({'type': 'stop'}));
    } catch (_) {}
    try {
      await _channel?.sink.close();
    } catch (_) {}
    _channel = null;
    try {
      await _speech.stop();
    } catch (_) {}
  }

  Future<void> dispose() async {
    await closeSession();
    await _transcriptController.close();
    await _errorController.close();
  }
}
