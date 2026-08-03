import 'dart:async';

import 'quran_speech_recognizer.dart';

/// Placeholder for a specialized Quran ASR API.
///
/// Do not wire this into [quranSpeechRecognizerProvider] until a real
/// endpoint returns word-level confidence and timestamps.
class AdvancedQuranAsrRecognizer implements QuranSpeechRecognizer {
  final Uri endpoint;
  final String? apiKey;

  AdvancedQuranAsrRecognizer({
    required this.endpoint,
    this.apiKey,
  });

  final StreamController<RecognizedSegment> _controller =
      StreamController<RecognizedSegment>.broadcast();

  @override
  Future<bool> initialize() async {
    return true;
  }

  @override
  Stream<RecognizedSegment> listen() {
    throw UnimplementedError(
      'AdvancedQuranAsrRecognizer يحتاج ربط API صوتي متخصص. '
      'يجب أن يرسل الصوت إلى endpoint ويرجع كلمات مع confidence و timestamps.',
    );
  }

  @override
  Future<void> stop() async {
    if (!_controller.isClosed) {
      await _controller.close();
    }
  }
}
