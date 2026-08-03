import 'aligned_word.dart';
import 'ayah_alignment_score.dart';
import 'tasmee3_weak_spot.dart';

class ForcedAlignmentResult {
  final String fullText;
  final double confidence;
  final List<AlignedWord> alignedWords;
  final List<AyahAlignmentScore> ayahScores;
  final List<Tasmee3WeakSpot> weakSpots;

  const ForcedAlignmentResult({
    required this.fullText,
    required this.confidence,
    required this.alignedWords,
    this.ayahScores = const [],
    this.weakSpots = const [],
  });

  factory ForcedAlignmentResult.fromJson(Map<String, dynamic> json) {
    final alignedJson = json['alignedWords'] as List<dynamic>? ?? const [];
    final ayahScoresJson = json['ayahScores'] as List<dynamic>? ?? const [];
    final weakSpotsJson = json['weakSpots'] as List<dynamic>? ?? const [];

    return ForcedAlignmentResult(
      fullText: json['fullText'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      alignedWords: alignedJson
          .map((item) => AlignedWord.fromJson(item as Map<String, dynamic>))
          .toList(),
      ayahScores: ayahScoresJson
          .map(
            (item) =>
                AyahAlignmentScore.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
      weakSpots: weakSpotsJson
          .map((item) => Tasmee3WeakSpot.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
