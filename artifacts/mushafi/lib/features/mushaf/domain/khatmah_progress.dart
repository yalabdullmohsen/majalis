class KhatmahProgress {
  final int lastPage;
  final int pagesRead;
  final int totalPages;
  final DateTime startedAt;
  final DateTime updatedAt;

  const KhatmahProgress({
    required this.lastPage,
    required this.pagesRead,
    required this.totalPages,
    required this.startedAt,
    required this.updatedAt,
  });

  double get progress {
    if (totalPages <= 0) return 0;
    return (pagesRead / totalPages).clamp(0, 1).toDouble();
  }

  int get progressPercent => (progress * 100).round();

  Map<String, dynamic> toJson() {
    return {
      'lastPage': lastPage,
      'pagesRead': pagesRead,
      'totalPages': totalPages,
      'startedAt': startedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory KhatmahProgress.fromJson(Map<String, dynamic> json) {
    return KhatmahProgress(
      lastPage: json['lastPage'] as int? ?? 1,
      pagesRead: json['pagesRead'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 604,
      startedAt: DateTime.parse(
        json['startedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      updatedAt: DateTime.parse(
        json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  factory KhatmahProgress.initial() {
    final now = DateTime.now();

    return KhatmahProgress(
      lastPage: 1,
      pagesRead: 0,
      totalPages: 604,
      startedAt: now,
      updatedAt: now,
    );
  }

  KhatmahProgress copyWith({
    int? lastPage,
    int? pagesRead,
    int? totalPages,
    DateTime? startedAt,
    DateTime? updatedAt,
  }) {
    return KhatmahProgress(
      lastPage: lastPage ?? this.lastPage,
      pagesRead: pagesRead ?? this.pagesRead,
      totalPages: totalPages ?? this.totalPages,
      startedAt: startedAt ?? this.startedAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
