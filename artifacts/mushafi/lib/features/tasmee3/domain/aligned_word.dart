import 'ayah_ref.dart';

enum AlignedWordStatus {
  correct,
  missing,
  mismatch,
  lowConfidence,
}

class AlignedWord {
  final String expectedWord;
  final String? recognizedWord;
  final int globalWordIndex;
  final int wordIndexInAyah;
  final AyahRef? ayahRef;
  final int? startMs;
  final int? endMs;
  final double confidence;
  final AlignedWordStatus status;

  const AlignedWord({
    required this.expectedWord,
    required this.recognizedWord,
    required this.globalWordIndex,
    required this.wordIndexInAyah,
    required this.ayahRef,
    required this.startMs,
    required this.endMs,
    required this.confidence,
    required this.status,
  });

  factory AlignedWord.fromJson(Map<String, dynamic> json) {
    final surah = json['surah'] as int?;
    final ayah = json['ayah'] as int?;

    return AlignedWord(
      expectedWord: json['expectedWord'] as String,
      recognizedWord: json['recognizedWord'] as String?,
      globalWordIndex: json['globalWordIndex'] as int,
      wordIndexInAyah:
          json['wordIndexInAyah'] as int? ?? json['globalWordIndex'] as int,
      ayahRef: surah == null || ayah == null
          ? null
          : AyahRef(surah: surah, ayah: ayah),
      startMs: json['startMs'] as int?,
      endMs: json['endMs'] as int?,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      status: _statusFromString(json['status'] as String?),
    );
  }

  static AlignedWordStatus _statusFromString(String? value) {
    switch (value) {
      case 'correct':
        return AlignedWordStatus.correct;
      case 'missing':
        return AlignedWordStatus.missing;
      case 'mismatch':
        return AlignedWordStatus.mismatch;
      case 'lowConfidence':
        return AlignedWordStatus.lowConfidence;
      default:
        return AlignedWordStatus.mismatch;
    }
  }
}
