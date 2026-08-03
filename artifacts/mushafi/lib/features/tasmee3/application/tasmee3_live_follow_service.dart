import '../domain/quran_ayah.dart';
import '../domain/tasmee3_live_progress.dart';
import '../domain/tasmee3_live_word.dart';
import '../domain/tasmee3_live_word_status.dart';
import 'arabic_normalizer.dart';

class Tasmee3LiveFollowService {
  const Tasmee3LiveFollowService();

  Tasmee3LiveProgress initialize(List<QuranAyah> ayahs) {
    final words = <Tasmee3LiveWord>[];
    var globalIndex = 0;

    for (final ayah in ayahs) {
      final splitWords = ayah.textUthmani
          .split(RegExp(r'\s+'))
          .where((word) => word.trim().isNotEmpty)
          .toList();

      for (int i = 0; i < splitWords.length; i++) {
        words.add(
          Tasmee3LiveWord(
            expectedWord: splitWords[i],
            normalizedExpected: ArabicNormalizer.normalize(splitWords[i]),
            recognizedWord: null,
            ayahRef: ayah.ref,
            globalWordIndex: globalIndex,
            wordIndexInAyah: i,
            status: globalIndex == 0
                ? Tasmee3LiveWordStatus.current
                : Tasmee3LiveWordStatus.pending,
            confidence: 0,
          ),
        );

        globalIndex++;
      }
    }

    return Tasmee3LiveProgress(
      words: words,
      currentWordIndex: 0,
      recognizedCount: 0,
      totalWords: words.length,
      currentAyah: words.isEmpty ? null : words.first.ayahRef,
      isUserPossiblySilent: false,
      lastUpdatedAt: DateTime.now(),
    );
  }

  Tasmee3LiveProgress updateWithRecognizedText({
    required Tasmee3LiveProgress current,
    required String recognizedText,
    required double confidence,
  }) {
    if (current.words.isEmpty) {
      return current;
    }

    final recognizedWords = ArabicNormalizer.tokenize(recognizedText);

    if (recognizedWords.isEmpty) {
      return _markSilenceIfNeeded(current);
    }

    // Rematch from scratch against cumulative partial text.
    final updated = [
      for (final word in current.words)
        Tasmee3LiveWord(
          expectedWord: word.expectedWord,
          normalizedExpected: word.normalizedExpected,
          recognizedWord: null,
          ayahRef: word.ayahRef,
          globalWordIndex: word.globalWordIndex,
          wordIndexInAyah: word.wordIndexInAyah,
          status: Tasmee3LiveWordStatus.pending,
          confidence: 0,
        ),
    ];

    var expectedIndex = 0;
    var recognizedIndex = 0;

    while (expectedIndex < updated.length &&
        recognizedIndex < recognizedWords.length) {
      final expected = updated[expectedIndex];
      final recognized = recognizedWords[recognizedIndex];

      if (expected.normalizedExpected == recognized ||
          _wordsAreClose(expected.normalizedExpected, recognized)) {
        updated[expectedIndex] = expected.copyWith(
          recognizedWord: recognized,
          status: expected.normalizedExpected == recognized
              ? Tasmee3LiveWordStatus.recognized
              : Tasmee3LiveWordStatus.possibleMistake,
          confidence: confidence,
        );

        expectedIndex++;
        recognizedIndex++;
        continue;
      }

      final nextExpected = expectedIndex + 1 < updated.length
          ? updated[expectedIndex + 1].normalizedExpected
          : null;

      if (nextExpected != null && nextExpected == recognized) {
        updated[expectedIndex] = expected.copyWith(
          status: Tasmee3LiveWordStatus.skipped,
          confidence: confidence,
        );

        expectedIndex++;
        continue;
      }

      updated[expectedIndex] = expected.copyWith(
        recognizedWord: recognized,
        status: Tasmee3LiveWordStatus.possibleMistake,
        confidence: confidence,
      );

      expectedIndex++;
      recognizedIndex++;
    }

    final recognizedCount = updated.where((word) {
      return word.status == Tasmee3LiveWordStatus.recognized ||
          word.status == Tasmee3LiveWordStatus.possibleMistake;
    }).length;

    final nextCurrentIndex = _findNextCurrentIndex(updated);

    for (int i = 0; i < updated.length; i++) {
      final word = updated[i];

      if (i == nextCurrentIndex &&
          word.status == Tasmee3LiveWordStatus.pending) {
        updated[i] = word.copyWith(status: Tasmee3LiveWordStatus.current);
      }
    }

    final currentAyah =
        nextCurrentIndex >= 0 && nextCurrentIndex < updated.length
            ? updated[nextCurrentIndex].ayahRef
            : updated.last.ayahRef;

    return Tasmee3LiveProgress(
      words: updated,
      currentWordIndex: nextCurrentIndex,
      recognizedCount: recognizedCount,
      totalWords: updated.length,
      currentAyah: currentAyah,
      isUserPossiblySilent: false,
      lastUpdatedAt: DateTime.now(),
    );
  }

  Tasmee3LiveProgress _markSilenceIfNeeded(Tasmee3LiveProgress current) {
    final last = current.lastUpdatedAt;
    final now = DateTime.now();

    final silent = last != null && now.difference(last).inSeconds >= 5;

    return Tasmee3LiveProgress(
      words: current.words,
      currentWordIndex: current.currentWordIndex,
      recognizedCount: current.recognizedCount,
      totalWords: current.totalWords,
      currentAyah: current.currentAyah,
      isUserPossiblySilent: silent,
      lastUpdatedAt: current.lastUpdatedAt,
    );
  }

  int _findNextCurrentIndex(List<Tasmee3LiveWord> words) {
    final index = words.indexWhere((word) {
      return word.status == Tasmee3LiveWordStatus.pending ||
          word.status == Tasmee3LiveWordStatus.current;
    });

    if (index == -1) {
      return words.length - 1;
    }

    return index;
  }

  bool _wordsAreClose(String expected, String recognized) {
    if (expected == recognized) {
      return true;
    }

    if (expected.length <= 3 || recognized.length <= 3) {
      return false;
    }

    final distance = _levenshtein(expected, recognized);
    final maxLen = expected.length > recognized.length
        ? expected.length
        : recognized.length;

    return distance / maxLen <= 0.25;
  }

  int _levenshtein(String a, String b) {
    final rows = a.length + 1;
    final cols = b.length + 1;

    final dp = List.generate(
      rows,
      (_) => List<int>.filled(cols, 0),
    );

    for (int i = 0; i < rows; i++) {
      dp[i][0] = i;
    }

    for (int j = 0; j < cols; j++) {
      dp[0][j] = j;
    }

    for (int i = 1; i < rows; i++) {
      for (int j = 1; j < cols; j++) {
        final cost = a[i - 1] == b[j - 1] ? 0 : 1;

        dp[i][j] = [
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        ].reduce((x, y) => x < y ? x : y);
      }
    }

    return dp[a.length][b.length];
  }
}
