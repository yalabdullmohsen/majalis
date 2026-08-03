class RecognizedWord {
  final String word;
  final int? startMs;
  final int? endMs;
  final double confidence;

  const RecognizedWord({
    required this.word,
    this.startMs,
    this.endMs,
    required this.confidence,
  });
}
