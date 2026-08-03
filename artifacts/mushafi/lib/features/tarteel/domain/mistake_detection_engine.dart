import 'package:equatable/equatable.dart';
import 'package:mushafi/core/utils/arabic_normalizer.dart';

enum MistakeType { missing, extra, wrongOrder, wrongWord, lowConfidence, skippedAyah }

class RecitationMistake extends Equatable {
  const RecitationMistake({
    required this.mistakeType,
    required this.ayahNumber,
    required this.wordIndex,
    required this.confidence,
    this.expectedWord,
    this.recognizedWord,
  });

  final MistakeType mistakeType;
  final String? expectedWord;
  final String? recognizedWord;
  final int ayahNumber;
  final int wordIndex;
  final double confidence;

  @override
  List<Object?> get props =>
      [mistakeType, expectedWord, recognizedWord, ayahNumber, wordIndex];
}

class MistakeDetectionEngine {
  List<RecitationMistake> compare({
    required List<String> expectedWords,
    required List<String> recognizedWords,
    required int ayahNumber,
    double confidenceThreshold = 0.55,
  }) {
    final exp = expectedWords.map(ArabicNormalizer.forSearch).toList();
    final got = recognizedWords.map(ArabicNormalizer.forSearch).toList();
    final mistakes = <RecitationMistake>[];

    final maxLen = exp.length > got.length ? exp.length : got.length;
    for (var i = 0; i < maxLen; i++) {
      final e = i < exp.length ? exp[i] : null;
      final g = i < got.length ? got[i] : null;
      if (e != null && g == null) {
        mistakes.add(RecitationMistake(
          mistakeType: MistakeType.missing,
          expectedWord: e,
          ayahNumber: ayahNumber,
          wordIndex: i,
          confidence: 1,
        ));
      } else if (e == null && g != null) {
        mistakes.add(RecitationMistake(
          mistakeType: MistakeType.extra,
          recognizedWord: g,
          ayahNumber: ayahNumber,
          wordIndex: i,
          confidence: 1,
        ));
      } else if (e != null && g != null && e != g) {
        mistakes.add(RecitationMistake(
          mistakeType: MistakeType.wrongWord,
          expectedWord: e,
          recognizedWord: g,
          ayahNumber: ayahNumber,
          wordIndex: i,
          confidence: 0.4,
        ));
      }
    }
    return mistakes;
  }
}
