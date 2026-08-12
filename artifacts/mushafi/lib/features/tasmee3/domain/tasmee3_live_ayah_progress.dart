import 'ayah_ref.dart';

class Tasmee3LiveAyahProgress {
  final AyahRef ayahRef;
  final int totalWords;
  final int recognizedWords;
  final int possibleMistakes;
  final bool completed;

  const Tasmee3LiveAyahProgress({
    required this.ayahRef,
    required this.totalWords,
    required this.recognizedWords,
    required this.possibleMistakes,
    required this.completed,
  });

  double get progress {
    if (totalWords <= 0) {
      return 0;
    }

    return (recognizedWords / totalWords).clamp(0, 1).toDouble();
  }

  int get progressPercent => (progress * 100).round();
}
