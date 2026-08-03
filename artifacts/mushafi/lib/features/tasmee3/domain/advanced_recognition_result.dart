import 'recognized_word.dart';

class AdvancedRecognitionResult {
  final String fullText;
  final List<RecognizedWord> words;
  final double confidence;
  final bool isFinal;

  const AdvancedRecognitionResult({
    required this.fullText,
    required this.words,
    required this.confidence,
    required this.isFinal,
  });

  factory AdvancedRecognitionResult.fromJson(Map<String, dynamic> json) {
    final wordsJson = (json['words'] as List<dynamic>? ?? const []);

    return AdvancedRecognitionResult(
      fullText: json['fullText'] as String? ?? '',
      words: wordsJson
          .map((item) => RecognizedWord.fromJson(item as Map<String, dynamic>))
          .toList(),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      isFinal: json['isFinal'] as bool? ?? true,
    );
  }
}
