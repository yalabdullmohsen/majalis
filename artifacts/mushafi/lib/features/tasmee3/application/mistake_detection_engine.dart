import '../domain/aligned_word.dart';
import '../domain/ayah_ref.dart';
import '../domain/forced_alignment_result.dart';
import '../domain/quran_ayah.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';
import 'arabic_normalizer.dart';

class ExpectedWord {
  final AyahRef ayahRef;
  final int globalIndex;
  final int wordIndexInAyah;
  final String original;
  final String normalized;

  const ExpectedWord({
    required this.ayahRef,
    required this.globalIndex,
    required this.wordIndexInAyah,
    required this.original,
    required this.normalized,
  });
}

class MistakeDetectionEngine {
  const MistakeDetectionEngine();

  /// Prefer this when the ASR engine already returns tokenized words
  /// (advanced Quran ASR with per-word confidence / timestamps).
  Tasmee3Result analyzeWords({
    required List<QuranAyah> expectedAyahs,
    required List<String> recognizedWords,
    required double confidence,
  }) {
    return analyze(
      expectedAyahs: expectedAyahs,
      recognizedText: recognizedWords.join(' '),
      confidence: confidence,
    );
  }

  /// Prefer this when the server returns Forced Alignment word statuses.
  Tasmee3Result analyzeAlignment({
    required ForcedAlignmentResult alignment,
    required AyahRef fallbackAyahRef,
  }) {
    final mistakes = <Tasmee3Mistake>[];

    for (final word in alignment.alignedWords) {
      if (word.status == AlignedWordStatus.correct) {
        continue;
      }

      final Tasmee3MistakeType type;
      switch (word.status) {
        case AlignedWordStatus.correct:
          continue;
        case AlignedWordStatus.missing:
          type = Tasmee3MistakeType.missingWord;
          break;
        case AlignedWordStatus.mismatch:
          type = Tasmee3MistakeType.wrongWord;
          break;
        case AlignedWordStatus.lowConfidence:
          type = Tasmee3MistakeType.lowConfidence;
          break;
      }

      mistakes.add(
        Tasmee3Mistake(
          type: type,
          ayahRef: word.ayahRef ?? fallbackAyahRef,
          globalWordIndex: word.globalWordIndex,
          wordIndexInAyah: word.wordIndexInAyah,
          expectedWord: word.expectedWord,
          recognizedWord: word.recognizedWord,
          confidence: word.confidence,
        ),
      );
    }

    final expectedWords =
        alignment.alignedWords.map((word) => word.expectedWord).toList();

    final recognizedWords = alignment.alignedWords
        .map((word) => word.recognizedWord ?? '')
        .where((word) => word.trim().isNotEmpty)
        .toList();

    final accuracy = _calculateAccuracy(
      expectedWordsCount: expectedWords.length,
      mistakes: mistakes,
    );

    return Tasmee3Result(
      expectedWords: expectedWords,
      recognizedWords: recognizedWords,
      mistakes: mistakes,
      accuracy: accuracy,
    );
  }

  Tasmee3Result analyze({
    required List<QuranAyah> expectedAyahs,
    required String recognizedText,
    required double confidence,
  }) {
    final expectedWords = _flattenExpectedWords(expectedAyahs);
    final recognizedWords = ArabicNormalizer.tokenize(recognizedText);

    final mistakes = <Tasmee3Mistake>[];

    int expectedIndex = 0;
    int recognizedIndex = 0;

    while (expectedIndex < expectedWords.length &&
        recognizedIndex < recognizedWords.length) {
      final expected = expectedWords[expectedIndex];
      final recognized = recognizedWords[recognizedIndex];

      if (expected.normalized == recognized) {
        expectedIndex++;
        recognizedIndex++;
        continue;
      }

      final nextExpected = expectedIndex + 1 < expectedWords.length
          ? expectedWords[expectedIndex + 1].normalized
          : null;

      final nextRecognized = recognizedIndex + 1 < recognizedWords.length
          ? recognizedWords[recognizedIndex + 1]
          : null;

      if (nextExpected != null && nextExpected == recognized) {
        mistakes.add(
          Tasmee3Mistake(
            type: Tasmee3MistakeType.missingWord,
            ayahRef: expected.ayahRef,
            globalWordIndex: expected.globalIndex,
            wordIndexInAyah: expected.wordIndexInAyah,
            expectedWord: expected.original,
            recognizedWord: null,
            confidence: confidence,
          ),
        );

        expectedIndex++;
        continue;
      }

      if (nextRecognized != null && expected.normalized == nextRecognized) {
        mistakes.add(
          Tasmee3Mistake(
            type: Tasmee3MistakeType.extraWord,
            ayahRef: expected.ayahRef,
            globalWordIndex: expected.globalIndex,
            wordIndexInAyah: expected.wordIndexInAyah,
            expectedWord: null,
            recognizedWord: recognized,
            confidence: confidence,
          ),
        );

        recognizedIndex++;
        continue;
      }

      mistakes.add(
        Tasmee3Mistake(
          type: Tasmee3MistakeType.wrongWord,
          ayahRef: expected.ayahRef,
          globalWordIndex: expected.globalIndex,
          wordIndexInAyah: expected.wordIndexInAyah,
          expectedWord: expected.original,
          recognizedWord: recognized,
          confidence: confidence,
        ),
      );

      expectedIndex++;
      recognizedIndex++;
    }

    while (expectedIndex < expectedWords.length) {
      final expected = expectedWords[expectedIndex];

      mistakes.add(
        Tasmee3Mistake(
          type: Tasmee3MistakeType.missingWord,
          ayahRef: expected.ayahRef,
          globalWordIndex: expected.globalIndex,
          wordIndexInAyah: expected.wordIndexInAyah,
          expectedWord: expected.original,
          recognizedWord: null,
          confidence: confidence,
        ),
      );

      expectedIndex++;
    }

    while (recognizedIndex < recognizedWords.length) {
      final fallbackRef = expectedWords.isNotEmpty
          ? expectedWords.last.ayahRef
          : const AyahRef(surah: 0, ayah: 0);

      mistakes.add(
        Tasmee3Mistake(
          type: Tasmee3MistakeType.extraWord,
          ayahRef: fallbackRef,
          globalWordIndex: expectedWords.length,
          wordIndexInAyah: expectedWords.length,
          expectedWord: null,
          recognizedWord: recognizedWords[recognizedIndex],
          confidence: confidence,
        ),
      );

      recognizedIndex++;
    }

    if (confidence > 0 && confidence < 0.55) {
      final fallbackRef = expectedWords.isNotEmpty
          ? expectedWords.first.ayahRef
          : const AyahRef(surah: 0, ayah: 0);

      mistakes.add(
        Tasmee3Mistake(
          type: Tasmee3MistakeType.lowConfidence,
          ayahRef: fallbackRef,
          globalWordIndex: 0,
          wordIndexInAyah: 0,
          expectedWord: null,
          recognizedWord: null,
          confidence: confidence,
        ),
      );
    }

    final originalExpectedWords =
        expectedWords.map((word) => word.original).toList();

    final accuracy = _calculateAccuracy(
      expectedWordsCount: originalExpectedWords.length,
      mistakes: mistakes,
    );

    return Tasmee3Result(
      expectedWords: originalExpectedWords,
      recognizedWords: recognizedWords,
      mistakes: mistakes,
      accuracy: accuracy,
    );
  }

  List<ExpectedWord> _flattenExpectedWords(List<QuranAyah> ayahs) {
    final words = <ExpectedWord>[];
    int globalIndex = 0;

    for (final ayah in ayahs) {
      final splitWords = ayah.textUthmani
          .split(RegExp(r'\s+'))
          .where((word) => word.trim().isNotEmpty)
          .toList();

      for (int i = 0; i < splitWords.length; i++) {
        words.add(
          ExpectedWord(
            ayahRef: ayah.ref,
            globalIndex: globalIndex,
            wordIndexInAyah: i,
            original: splitWords[i],
            normalized: ArabicNormalizer.normalize(splitWords[i]),
          ),
        );

        globalIndex++;
      }
    }

    return words;
  }

  double _calculateAccuracy({
    required int expectedWordsCount,
    required List<Tasmee3Mistake> mistakes,
  }) {
    if (expectedWordsCount == 0) {
      return 0;
    }

    final realMistakes = mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord;
    }).length;

    final score = 1 - realMistakes / expectedWordsCount;

    return score.clamp(0, 1);
  }
}
