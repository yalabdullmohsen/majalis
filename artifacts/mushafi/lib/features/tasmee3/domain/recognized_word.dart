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

  factory RecognizedWord.fromJson(Map<String, dynamic> json) {
    return RecognizedWord(
      word: json['word'] as String,
      startMs: json['startMs'] as int?,
      endMs: json['endMs'] as int?,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    );
  }
}
