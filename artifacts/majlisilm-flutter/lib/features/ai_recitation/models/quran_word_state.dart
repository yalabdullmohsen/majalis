import 'word_recitation_status.dart';

/// One Quran word with both diacritic-preserving and normalized forms.
class QuranWordState {
  const QuranWordState({
    required this.originalWord,
    required this.normalizedWord,
    required this.status,
    this.index = 0,
  });

  /// Original Uthmani token including tashkeel / Quranic marks.
  final String originalWord;

  /// Diacritic-stripped form used for fuzzy matching.
  final String normalizedWord;

  /// Live alignment status for this word.
  final WordRecitationStatus status;

  /// Zero-based index inside the target verse.
  final int index;

  QuranWordState copyWith({
    String? originalWord,
    String? normalizedWord,
    WordRecitationStatus? status,
    int? index,
  }) {
    return QuranWordState(
      originalWord: originalWord ?? this.originalWord,
      normalizedWord: normalizedWord ?? this.normalizedWord,
      status: status ?? this.status,
      index: index ?? this.index,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is QuranWordState &&
        other.originalWord == originalWord &&
        other.normalizedWord == normalizedWord &&
        other.status == status &&
        other.index == index;
  }

  @override
  int get hashCode => Object.hash(originalWord, normalizedWord, status, index);

  @override
  String toString() =>
      'QuranWordState($index, "$originalWord" → "$normalizedWord", $status)';
}
