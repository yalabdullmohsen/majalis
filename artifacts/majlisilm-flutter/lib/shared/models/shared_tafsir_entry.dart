/// Tafsir / content edit pair — shared for user modal + admin diff (Phase 2).
class SharedTafsirEntry {
  const SharedTafsirEntry({
    required this.id,
    required this.verseId,
    required this.originalText,
    required this.editedText,
    this.sourceLabel = '',
  });

  final String id;
  final String verseId;
  final String originalText;
  final String editedText;
  final String sourceLabel;

  bool get hasDiff =>
      originalText.trim().isNotEmpty && originalText != editedText;

  Map<String, dynamic> toJson() => {
        'id': id,
        'verseId': verseId,
        'originalText': originalText,
        'editedText': editedText,
        'sourceLabel': sourceLabel,
      };

  factory SharedTafsirEntry.fromJson(Map<String, dynamic> json) {
    return SharedTafsirEntry(
      id: json['id'] as String? ?? '',
      verseId: json['verseId'] as String? ?? '',
      originalText: json['originalText'] as String? ?? '',
      editedText: json['editedText'] as String? ?? '',
      sourceLabel: json['sourceLabel'] as String? ?? '',
    );
  }
}
