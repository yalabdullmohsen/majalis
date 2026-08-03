import 'aligned_word.dart';

class ForcedAlignmentResult {
  final String fullText;
  final double confidence;
  final List<AlignedWord> alignedWords;

  const ForcedAlignmentResult({
    required this.fullText,
    required this.confidence,
    required this.alignedWords,
  });

  factory ForcedAlignmentResult.fromJson(Map<String, dynamic> json) {
    final alignedJson = json['alignedWords'] as List<dynamic>? ?? const [];

    return ForcedAlignmentResult(
      fullText: json['fullText'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      alignedWords: alignedJson
          .map((item) => AlignedWord.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
