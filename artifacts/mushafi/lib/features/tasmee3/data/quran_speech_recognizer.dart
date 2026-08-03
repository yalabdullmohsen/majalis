import 'dart:async';

import '../domain/advanced_recognition_result.dart';
import '../domain/forced_alignment_result.dart';
import '../domain/live_audio_level.dart';
import '../domain/recognized_word.dart';

class RecognizedSegment {
  final String text;
  final double confidence;
  final bool isFinal;
  final DateTime timestamp;
  final List<RecognizedWord> words;
  final ForcedAlignmentResult? alignment;

  const RecognizedSegment({
    required this.text,
    required this.confidence,
    required this.isFinal,
    required this.timestamp,
    this.words = const [],
    this.alignment,
  });

  factory RecognizedSegment.fromAdvanced(AdvancedRecognitionResult result) {
    return RecognizedSegment(
      text: result.fullText,
      confidence: result.confidence,
      isFinal: result.isFinal,
      timestamp: DateTime.now(),
      words: result.words,
    );
  }

  factory RecognizedSegment.fromAlignment(ForcedAlignmentResult result) {
    return RecognizedSegment(
      text: result.fullText,
      confidence: result.confidence,
      isFinal: true,
      timestamp: DateTime.now(),
      alignment: result,
    );
  }
}

abstract class QuranSpeechRecognizer {
  Future<bool> initialize();

  Stream<RecognizedSegment> listen();

  Stream<LiveAudioLevel> get audioLevels;

  Future<void> stop();
}
