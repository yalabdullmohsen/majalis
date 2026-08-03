class KhatmahReadingLog {
  final String id;
  final String planId;
  final int fromPage;
  final int toPage;
  final int pagesCount;
  final DateTime readAt;

  const KhatmahReadingLog({
    required this.id,
    required this.planId,
    required this.fromPage,
    required this.toPage,
    required this.pagesCount,
    required this.readAt,
  });

  bool get isToday {
    final now = DateTime.now();
    return readAt.year == now.year &&
        readAt.month == now.month &&
        readAt.day == now.day;
  }

  bool get isThisWeek {
    final now = DateTime.now();
    return now.difference(readAt).inDays < 7;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'planId': planId,
      'fromPage': fromPage,
      'toPage': toPage,
      'pagesCount': pagesCount,
      'readAt': readAt.toIso8601String(),
    };
  }

  factory KhatmahReadingLog.fromJson(Map<String, dynamic> json) {
    return KhatmahReadingLog(
      id: json['id'] as String,
      planId: json['planId'] as String,
      fromPage: json['fromPage'] as int,
      toPage: json['toPage'] as int,
      pagesCount: json['pagesCount'] as int? ?? 0,
      readAt: DateTime.parse(json['readAt'] as String),
    );
  }
}
