import 'tasmee3_mistake.dart';

class Tasmee3Result {
  final List<String> expectedWords;
  final List<String> recognizedWords;
  final List<Tasmee3Mistake> mistakes;
  final double accuracy;

  const Tasmee3Result({
    required this.expectedWords,
    required this.recognizedWords,
    required this.mistakes,
    required this.accuracy,
  });

  int get accuracyPercent => (accuracy * 100).round();

  int get mistakesCount {
    return mistakes
        .where((m) =>
            m.type == Tasmee3MistakeType.missingWord ||
            m.type == Tasmee3MistakeType.extraWord ||
            m.type == Tasmee3MistakeType.wrongWord)
        .length;
  }

  bool get hasLowConfidence {
    return mistakes.any((m) => m.type == Tasmee3MistakeType.lowConfidence);
  }
}
