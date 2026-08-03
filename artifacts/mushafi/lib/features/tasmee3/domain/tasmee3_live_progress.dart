import 'ayah_ref.dart';
import 'tasmee3_live_word.dart';

class Tasmee3LiveProgress {
  final List<Tasmee3LiveWord> words;
  final int currentWordIndex;
  final int recognizedCount;
  final int totalWords;
  final AyahRef? currentAyah;
  final bool isUserPossiblySilent;
  final DateTime? lastUpdatedAt;

  const Tasmee3LiveProgress({
    required this.words,
    required this.currentWordIndex,
    required this.recognizedCount,
    required this.totalWords,
    required this.currentAyah,
    required this.isUserPossiblySilent,
    required this.lastUpdatedAt,
  });

  const Tasmee3LiveProgress.empty()
      : words = const [],
        currentWordIndex = 0,
        recognizedCount = 0,
        totalWords = 0,
        currentAyah = null,
        isUserPossiblySilent = false,
        lastUpdatedAt = null;

  double get progress {
    if (totalWords <= 0) {
      return 0;
    }

    return (recognizedCount / totalWords).clamp(0, 1).toDouble();
  }

  int get progressPercent => (progress * 100).round();

  bool get hasWords => words.isNotEmpty;
}
