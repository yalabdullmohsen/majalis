import 'ayah_ref.dart';
import 'ayah_mastery_level.dart';

class AyahMasteryRecord {
  final AyahRef ayahRef;
  final AyahMasteryLevel level;
  final double masteryScore;
  final int reviewCount;
  final int mistakeCount;
  final int consecutiveSuccesses;
  final DateTime? lastReviewedAt;
  final DateTime nextReviewAt;

  const AyahMasteryRecord({
    required this.ayahRef,
    required this.level,
    required this.masteryScore,
    required this.reviewCount,
    required this.mistakeCount,
    required this.consecutiveSuccesses,
    required this.lastReviewedAt,
    required this.nextReviewAt,
  });

  bool get isDue {
    final now = DateTime.now();
    return !nextReviewAt.isAfter(now);
  }

  int get masteryPercent => (masteryScore * 100).round();

  AyahMasteryRecord copyWith({
    AyahMasteryLevel? level,
    double? masteryScore,
    int? reviewCount,
    int? mistakeCount,
    int? consecutiveSuccesses,
    DateTime? lastReviewedAt,
    DateTime? nextReviewAt,
  }) {
    return AyahMasteryRecord(
      ayahRef: ayahRef,
      level: level ?? this.level,
      masteryScore: masteryScore ?? this.masteryScore,
      reviewCount: reviewCount ?? this.reviewCount,
      mistakeCount: mistakeCount ?? this.mistakeCount,
      consecutiveSuccesses:
          consecutiveSuccesses ?? this.consecutiveSuccesses,
      lastReviewedAt: lastReviewedAt ?? this.lastReviewedAt,
      nextReviewAt: nextReviewAt ?? this.nextReviewAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'surah': ayahRef.surah,
      'ayah': ayahRef.ayah,
      'level': level.name,
      'masteryScore': masteryScore,
      'reviewCount': reviewCount,
      'mistakeCount': mistakeCount,
      'consecutiveSuccesses': consecutiveSuccesses,
      'lastReviewedAt': lastReviewedAt?.toIso8601String(),
      'nextReviewAt': nextReviewAt.toIso8601String(),
    };
  }

  factory AyahMasteryRecord.fromJson(Map<String, dynamic> json) {
    final levelName = json['level'] as String?;

    final level = AyahMasteryLevel.values.firstWhere(
      (item) => item.name == levelName,
      orElse: () => AyahMasteryLevel.newAyah,
    );

    return AyahMasteryRecord(
      ayahRef: AyahRef(
        surah: json['surah'] as int,
        ayah: json['ayah'] as int,
      ),
      level: level,
      masteryScore: (json['masteryScore'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      mistakeCount: json['mistakeCount'] as int? ?? 0,
      consecutiveSuccesses: json['consecutiveSuccesses'] as int? ?? 0,
      lastReviewedAt: json['lastReviewedAt'] == null
          ? null
          : DateTime.parse(json['lastReviewedAt'] as String),
      nextReviewAt: DateTime.parse(
        json['nextReviewAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  factory AyahMasteryRecord.initial(AyahRef ref) {
    return AyahMasteryRecord(
      ayahRef: ref,
      level: AyahMasteryLevel.newAyah,
      masteryScore: 0,
      reviewCount: 0,
      mistakeCount: 0,
      consecutiveSuccesses: 0,
      lastReviewedAt: null,
      nextReviewAt: DateTime.now(),
    );
  }
}
