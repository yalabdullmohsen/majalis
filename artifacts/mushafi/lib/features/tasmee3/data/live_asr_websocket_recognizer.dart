import 'dart:async';

import '../domain/live_audio_level.dart';
import 'quran_speech_recognizer.dart';

/// Future WebSocket ASR recognizer scaffold.
/// Not wired into providers by default — keep speech_to_text / advanced fallback.
class LiveAsrWebSocketRecognizer implements QuranSpeechRecognizer {
  final Uri websocketUri;
  final String? apiKey;

  LiveAsrWebSocketRecognizer({
    required this.websocketUri,
    this.apiKey,
  });

  final StreamController<RecognizedSegment> _segmentsController =
      StreamController<RecognizedSegment>.broadcast();

  final StreamController<LiveAudioLevel> _levelsController =
      StreamController<LiveAudioLevel>.broadcast();

  @override
  Future<bool> initialize() async {
    return true;
  }

  @override
  Stream<RecognizedSegment> listen() {
    throw UnimplementedError(
      'LiveAsrWebSocketRecognizer جاهز كبنية مستقبلية. '
      'يحتاج ربط stream صوتي بخادم WebSocket يرجع partial segments.',
    );
  }

  @override
  Stream<LiveAudioLevel> get audioLevels => _levelsController.stream;

  @override
  Future<void> stop() async {
    if (!_segmentsController.isClosed) {
      await _segmentsController.close();
    }
    if (!_levelsController.isClosed) {
      await _levelsController.close();
    }
  }
}
