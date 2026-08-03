import 'ayah_ref.dart';

class AyahAlignmentScore {
  final AyahRef ayahRef;
  final int totalWords;
  final int correctWords;
  final int missingWords;
  final int wrongWords;
  final int lowConfidenceWords;
  final double accuracy;

  const AyahAlignmentScore({
    required this.ayahRef,
    required this.totalWords,
    required this.correctWords,
    required this.missingWords,
    required this.wrongWords,
    required this.lowConfidenceWords,
    required this.accuracy,
  });

  int get accuracyPercent => (accuracy * 100).round();

  bool get needsReview {
    return accuracy < 0.85 || missingWords > 0 || wrongWords > 0;
  }

  factory AyahAlignmentScore.fromJson(Map<String, dynamic> json) {
    return AyahAlignmentScore(
      ayahRef: AyahRef(
        surah: json['surah'] as int,
        ayah: json['ayah'] as int,
      ),
      totalWords: json['totalWords'] as int? ?? 0,
      correctWords: json['correctWords'] as int? ?? 0,
      missingWords: json['missingWords'] as int? ?? 0,
      wrongWords: json['wrongWords'] as int? ?? 0,
      lowConfidenceWords: json['lowConfidenceWords'] as int? ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0,
    );
  }
}
