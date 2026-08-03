import 'ayah_ref.dart';
import 'tasmee3_live_word_status.dart';

class Tasmee3LiveWord {
  final String expectedWord;
  final String normalizedExpected;
  final String? recognizedWord;
  final AyahRef ayahRef;
  final int globalWordIndex;
  final int wordIndexInAyah;
  final Tasmee3LiveWordStatus status;
  final double confidence;

  const Tasmee3LiveWord({
    required this.expectedWord,
    required this.normalizedExpected,
    required this.recognizedWord,
    required this.ayahRef,
    required this.globalWordIndex,
    required this.wordIndexInAyah,
    required this.status,
    required this.confidence,
  });

  Tasmee3LiveWord copyWith({
    String? recognizedWord,
    Tasmee3LiveWordStatus? status,
    double? confidence,
  }) {
    return Tasmee3LiveWord(
      expectedWord: expectedWord,
      normalizedExpected: normalizedExpected,
      recognizedWord: recognizedWord ?? this.recognizedWord,
      ayahRef: ayahRef,
      globalWordIndex: globalWordIndex,
      wordIndexInAyah: wordIndexInAyah,
      status: status ?? this.status,
      confidence: confidence ?? this.confidence,
    );
  }
}
