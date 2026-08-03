import 'khatmah_plan_status.dart';

class KhatmahPlan {
  final String id;
  final String title;
  final int totalPages;
  final int targetDays;
  final int startPage;
  final int currentPage;
  final int pagesRead;
  final DateTime startedAt;
  final DateTime? completedAt;
  final DateTime updatedAt;
  final KhatmahPlanStatus status;

  const KhatmahPlan({
    required this.id,
    required this.title,
    required this.totalPages,
    required this.targetDays,
    required this.startPage,
    required this.currentPage,
    required this.pagesRead,
    required this.startedAt,
    required this.completedAt,
    required this.updatedAt,
    required this.status,
  });

  int get dailyPagesTarget {
    if (targetDays <= 0) return totalPages;
    return (totalPages / targetDays).ceil();
  }

  double get progress {
    if (totalPages <= 0) return 0;
    return (pagesRead / totalPages).clamp(0, 1).toDouble();
  }

  int get progressPercent => (progress * 100).round();

  int get remainingPages {
    final remaining = totalPages - pagesRead;
    return remaining < 0 ? 0 : remaining;
  }

  int get elapsedDays {
    final now = DateTime.now();
    final diff = now.difference(startedAt).inDays + 1;
    return diff < 1 ? 1 : diff;
  }

  int get expectedPagesByToday {
    final expected = elapsedDays * dailyPagesTarget;
    return expected > totalPages ? totalPages : expected;
  }

  int get lateByPages {
    final late = expectedPagesByToday - pagesRead;
    return late > 0 ? late : 0;
  }

  bool get isLate => lateByPages > 0 && status == KhatmahPlanStatus.active;

  bool get isCompleted => status == KhatmahPlanStatus.completed;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'totalPages': totalPages,
      'targetDays': targetDays,
      'startPage': startPage,
      'currentPage': currentPage,
      'pagesRead': pagesRead,
      'startedAt': startedAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'status': status.name,
    };
  }

  factory KhatmahPlan.fromJson(Map<String, dynamic> json) {
    final statusName = json['status'] as String?;

    final status = KhatmahPlanStatus.values.firstWhere(
      (item) => item.name == statusName,
      orElse: () => KhatmahPlanStatus.active,
    );

    return KhatmahPlan(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'ختمة',
      totalPages: json['totalPages'] as int? ?? 604,
      targetDays: json['targetDays'] as int? ?? 30,
      startPage: json['startPage'] as int? ?? 1,
      currentPage: json['currentPage'] as int? ?? 1,
      pagesRead: json['pagesRead'] as int? ?? 0,
      startedAt: DateTime.parse(
        json['startedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
      updatedAt: DateTime.parse(
        json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
      status: status,
    );
  }

  factory KhatmahPlan.newPlan({
    required String title,
    required int targetDays,
    int startPage = 1,
    int totalPages = 604,
  }) {
    final now = DateTime.now();

    return KhatmahPlan(
      id: now.microsecondsSinceEpoch.toString(),
      title: title,
      totalPages: totalPages,
      targetDays: targetDays,
      startPage: startPage,
      currentPage: startPage,
      pagesRead: 0,
      startedAt: now,
      completedAt: null,
      updatedAt: now,
      status: KhatmahPlanStatus.active,
    );
  }

  KhatmahPlan copyWith({
    String? title,
    int? totalPages,
    int? targetDays,
    int? startPage,
    int? currentPage,
    int? pagesRead,
    DateTime? startedAt,
    DateTime? completedAt,
    bool clearCompletedAt = false,
    DateTime? updatedAt,
    KhatmahPlanStatus? status,
  }) {
    return KhatmahPlan(
      id: id,
      title: title ?? this.title,
      totalPages: totalPages ?? this.totalPages,
      targetDays: targetDays ?? this.targetDays,
      startPage: startPage ?? this.startPage,
      currentPage: currentPage ?? this.currentPage,
      pagesRead: pagesRead ?? this.pagesRead,
      startedAt: startedAt ?? this.startedAt,
      completedAt: clearCompletedAt ? null : completedAt ?? this.completedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      status: status ?? this.status,
    );
  }
}
