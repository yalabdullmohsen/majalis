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
}
