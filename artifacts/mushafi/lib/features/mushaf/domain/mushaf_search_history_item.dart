class MushafSearchHistoryItem {
  final String query;
  final DateTime searchedAt;

  const MushafSearchHistoryItem({
    required this.query,
    required this.searchedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'query': query,
      'searchedAt': searchedAt.toIso8601String(),
    };
  }

  factory MushafSearchHistoryItem.fromJson(Map<String, dynamic> json) {
    return MushafSearchHistoryItem(
      query: json['query'] as String? ?? '',
      searchedAt: DateTime.parse(
        json['searchedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }
}
