import 'ayah_ref.dart';

enum Tasmee3MistakeType {
  missingWord,
  extraWord,
  wrongWord,
  lowConfidence,
}

class Tasmee3Mistake {
  final Tasmee3MistakeType type;
  final AyahRef ayahRef;
  final int globalWordIndex;
  final int wordIndexInAyah;
  final String? expectedWord;
  final String? recognizedWord;
  final double confidence;

  const Tasmee3Mistake({
    required this.type,
    required this.ayahRef,
    required this.globalWordIndex,
    required this.wordIndexInAyah,
    this.expectedWord,
    this.recognizedWord,
    required this.confidence,
  });
}
