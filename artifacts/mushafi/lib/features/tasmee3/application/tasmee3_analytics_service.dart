import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_achievement.dart';
import '../domain/tasmee3_daily_stats.dart';
import '../domain/tasmee3_review_plan_item.dart';
import '../domain/tasmee3_session_record.dart';

class Tasmee3AnalyticsService {
  const Tasmee3AnalyticsService();

  List<Tasmee3DailyStats> buildLast7DaysStats(
    List<Tasmee3SessionRecord> sessions,
  ) {
    final now = DateTime.now();

    final days = List.generate(7, (index) {
      final date = DateTime(now.year, now.month, now.day)
          .subtract(Duration(days: 6 - index));
      return date;
    });

    return days.map((day) {
      final nextDay = day.add(const Duration(days: 1));

      final daySessions = sessions.where((session) {
        return !session.createdAt.isBefore(day) &&
            session.createdAt.isBefore(nextDay);
      }).toList();

      if (daySessions.isEmpty) {
        return Tasmee3DailyStats(
          day: day,
          sessionsCount: 0,
          totalDurationSeconds: 0,
          totalMistakes: 0,
          averageAccuracy: 0,
        );
      }

      final totalDuration = daySessions.fold<int>(
        0,
        (sum, session) => sum + session.durationSeconds,
      );

      final totalMistakes = daySessions.fold<int>(
        0,
        (sum, session) => sum + session.mistakesCount,
      );

      final averageAccuracy = daySessions.fold<double>(
            0,
            (sum, session) => sum + (session.accuracyPercent / 100),
          ) /
          daySessions.length;

      return Tasmee3DailyStats(
        day: day,
        sessionsCount: daySessions.length,
        totalDurationSeconds: totalDuration,
        totalMistakes: totalMistakes,
        averageAccuracy: averageAccuracy,
      );
    }).toList();
  }

  /// Auto weekly review plan based on sessions from the last 7 days only.
  List<Tasmee3ReviewPlanItem> buildWeeklyReviewPlan(
    List<Tasmee3SessionRecord> sessions,
  ) {
    final now = DateTime.now();
    final weekStart =
        DateTime(now.year, now.month, now.day).subtract(const Duration(days: 6));

    final weekSessions = sessions
        .where((session) => !session.createdAt.isBefore(weekStart))
        .toList();

    return buildReviewPlan(weekSessions);
  }

  List<Tasmee3ReviewPlanItem> buildReviewPlan(
    List<Tasmee3SessionRecord> sessions,
  ) {
    final weakMap = <String, _ReviewAccumulator>{};

    for (final session in sessions.take(100)) {
      final target = session.target;

      for (final ref in _expandTarget(target)) {
        final key = ref.key;

        final current = weakMap[key] ??
            _ReviewAccumulator(
              ref: ref,
              sessions: 0,
              lowAccuracyCount: 0,
              mistakes: 0,
            );

        weakMap[key] = current.copyWith(
          sessions: current.sessions + 1,
          lowAccuracyCount:
              current.lowAccuracyCount + (session.accuracyPercent < 85 ? 1 : 0),
          mistakes: current.mistakes + session.mistakesCount,
        );
      }
    }

    final items = weakMap.values
        .where((item) => item.lowAccuracyCount > 0 || item.mistakes > 0)
        .map((item) {
      final ReviewPriority priority;

      if (item.lowAccuracyCount >= 2 || item.mistakes >= 8) {
        priority = ReviewPriority.high;
      } else if (item.lowAccuracyCount == 1 || item.mistakes >= 3) {
        priority = ReviewPriority.medium;
      } else {
        priority = ReviewPriority.low;
      }

      final int repeats;

      switch (priority) {
        case ReviewPriority.high:
          repeats = 5;
          break;
        case ReviewPriority.medium:
          repeats = 3;
          break;
        case ReviewPriority.low:
          repeats = 2;
          break;
      }

      return Tasmee3ReviewPlanItem(
        ayahRef: item.ref,
        priority: priority,
        reason:
            'ظهرت أخطاء أو دقة منخفضة في جلسات سابقة. الأخطاء التقريبية: ${item.mistakes}.',
        recommendedRepeats: repeats,
        createdAt: DateTime.now(),
      );
    }).toList();

    items.sort((a, b) {
      return _priorityWeight(b.priority).compareTo(_priorityWeight(a.priority));
    });

    return items.take(20).toList();
  }

  List<Tasmee3Achievement> buildAchievements(
    List<Tasmee3SessionRecord> sessions,
  ) {
    final weekStats = buildLast7DaysStats(sessions);
    final weekSessions = weekStats.fold<int>(
      0,
      (sum, day) => sum + day.sessionsCount,
    );
    final bestAccuracy = sessions.isEmpty
        ? 0
        : sessions.map((s) => s.accuracyPercent).reduce((a, b) => a > b ? a : b);
    final perfectSessions =
        sessions.where((s) => s.mistakesCount == 0 && s.accuracyPercent >= 95);

    return [
      Tasmee3Achievement(
        id: 'first_session',
        title: 'أول تسميع',
        description: 'أكمل أول جلسة تسميع.',
        unlocked: sessions.isNotEmpty,
      ),
      Tasmee3Achievement(
        id: 'five_sessions',
        title: 'مواظب',
        description: 'أكمل 5 جلسات تسميع.',
        unlocked: sessions.length >= 5,
      ),
      Tasmee3Achievement(
        id: 'week_active',
        title: 'نشط هذا الأسبوع',
        description: 'أكمل 3 جلسات خلال آخر 7 أيام.',
        unlocked: weekSessions >= 3,
      ),
      Tasmee3Achievement(
        id: 'high_accuracy',
        title: 'دقة تقريبية عالية',
        description: 'وصلت إلى دقة تقريبية 90% أو أكثر في جلسة.',
        unlocked: bestAccuracy >= 90,
      ),
      Tasmee3Achievement(
        id: 'clean_session',
        title: 'جلسة نظيفة',
        description: 'جلسة بلا أخطاء ظاهرة وبدقة تقريبية 95% فأكثر.',
        unlocked: perfectSessions.isNotEmpty,
      ),
    ];
  }

  List<AyahRef> _expandTarget(RecitationTarget target) {
    if (target.from.surah != target.to.surah) {
      return [target.from];
    }

    return List.generate(
      target.to.ayah - target.from.ayah + 1,
      (index) => AyahRef(
        surah: target.from.surah,
        ayah: target.from.ayah + index,
      ),
    );
  }

  int _priorityWeight(ReviewPriority priority) {
    switch (priority) {
      case ReviewPriority.high:
        return 3;
      case ReviewPriority.medium:
        return 2;
      case ReviewPriority.low:
        return 1;
    }
  }
}

class _ReviewAccumulator {
  final AyahRef ref;
  final int sessions;
  final int lowAccuracyCount;
  final int mistakes;

  const _ReviewAccumulator({
    required this.ref,
    required this.sessions,
    required this.lowAccuracyCount,
    required this.mistakes,
  });

  _ReviewAccumulator copyWith({
    int? sessions,
    int? lowAccuracyCount,
    int? mistakes,
  }) {
    return _ReviewAccumulator(
      ref: ref,
      sessions: sessions ?? this.sessions,
      lowAccuracyCount: lowAccuracyCount ?? this.lowAccuracyCount,
      mistakes: mistakes ?? this.mistakes,
    );
  }
}
