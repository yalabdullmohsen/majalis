import 'recognized_word.dart';

enum LiveAsrMessageType {
  partial,
  finalResult,
  error,
  ready,
}

class LiveAsrMessage {
  final LiveAsrMessageType type;
  final String text;
  final List<RecognizedWord> words;
  final double confidence;
  final String? errorMessage;
  final int sequence;

  const LiveAsrMessage({
    required this.type,
    required this.text,
    this.words = const [],
    this.confidence = 0,
    this.errorMessage,
    this.sequence = 0,
  });

  factory LiveAsrMessage.fromJson(Map<String, dynamic> json) {
    final typeRaw = json['type'] as String? ?? '';

    LiveAsrMessageType type;

    switch (typeRaw) {
      case 'partial':
        type = LiveAsrMessageType.partial;
        break;
      case 'final':
        type = LiveAsrMessageType.finalResult;
        break;
      case 'ready':
        type = LiveAsrMessageType.ready;
        break;
      case 'error':
        type = LiveAsrMessageType.error;
        break;
      default:
        type = LiveAsrMessageType.error;
        break;
    }

    final wordsJson = json['words'] as List<dynamic>? ?? const [];

    return LiveAsrMessage(
      type: type,
      text: json['text'] as String? ?? '',
      words: wordsJson.map((item) {
        final map = item as Map<String, dynamic>;
        return RecognizedWord(
          word: map['word'] as String? ?? '',
          startMs: map['startMs'] as int?,
          endMs: map['endMs'] as int?,
          confidence: (map['confidence'] as num?)?.toDouble() ?? 0,
        );
      }).toList(),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      errorMessage: json['error'] as String?,
      sequence: json['sequence'] as int? ?? 0,
    );
  }
}
