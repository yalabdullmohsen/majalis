import 'dart:async';

class RecognizedSegment {
  final String text;
  final double confidence;
  final bool isFinal;
  final DateTime timestamp;

  const RecognizedSegment({
    required this.text,
    required this.confidence,
    required this.isFinal,
    required this.timestamp,
  });
}

abstract class QuranSpeechRecognizer {
  Future<bool> initialize();

  Stream<RecognizedSegment> listen();

  Future<void> stop();
}
