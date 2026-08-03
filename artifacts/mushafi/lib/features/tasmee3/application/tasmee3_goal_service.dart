import '../domain/tasmee3_badge.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_goal_progress.dart';
import '../domain/tasmee3_session_record.dart';

class Tasmee3GoalService {
  const Tasmee3GoalService();

  Tasmee3GoalProgress buildTodayProgress({
    required Tasmee3DailyGoal goal,
    required List<Tasmee3SessionRecord> sessions,
  }) {
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day);
    final end = start.add(const Duration(days: 1));

    final todaySessions = sessions.where((session) {
      return !session.createdAt.isBefore(start) &&
          session.createdAt.isBefore(end);
    }).toList();

    final int currentValue;

    switch (goal.type) {
      case Tasmee3GoalType.sessions:
        currentValue = todaySessions.length;
        break;
      case Tasmee3GoalType.minutes:
        currentValue = todaySessions.fold<int>(
          0,
          (sum, session) => sum + (session.durationSeconds / 60).round(),
        );
        break;
      case Tasmee3GoalType.ayahs:
        currentValue = todaySessions.fold<int>(
          0,
          (sum, session) {
            if (session.target.from.surah != session.target.to.surah) {
              return sum + 1;
            }

            return sum +
                (session.target.to.ayah - session.target.from.ayah + 1);
          },
        );
        break;
    }

    return Tasmee3GoalProgress(
      goal: goal,
      currentValue: currentValue,
      targetValue: goal.targetValue,
    );
  }

  int calculateStreak(List<Tasmee3SessionRecord> sessions) {
    if (sessions.isEmpty) {
      return 0;
    }

    final sessionDays = sessions.map((session) {
      final date = session.createdAt;
      return DateTime(date.year, date.month, date.day);
    }).toSet();

    final today = DateTime.now();
    var cursor = DateTime(today.year, today.month, today.day);

    // If today has no session yet, allow streak to continue from yesterday.
    if (!sessionDays.contains(cursor)) {
      cursor = cursor.subtract(const Duration(days: 1));
    }

    var streak = 0;

    while (sessionDays.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    return streak;
  }

  List<Tasmee3Badge> buildBadges(List<Tasmee3SessionRecord> sessions) {
    final streak = calculateStreak(sessions);

    final hasHighAccuracy = sessions.any(
      (session) => session.accuracyPercent >= 95,
    );

    final hasReviewHero = sessions.any(
      (session) => session.mistakesCount == 0 && session.accuracyPercent >= 90,
    );

    return [
      Tasmee3Badge(
        type: Tasmee3BadgeType.firstSession,
        title: 'البداية المباركة',
        description: 'أكملت أول جلسة تسميع.',
        unlocked: sessions.isNotEmpty,
        unlockedAt: sessions.isNotEmpty ? sessions.last.createdAt : null,
      ),
      Tasmee3Badge(
        type: Tasmee3BadgeType.threeDayStreak,
        title: 'ثبات 3 أيام',
        description: 'حافظت على التسميع 3 أيام متتالية.',
        unlocked: streak >= 3,
        unlockedAt: streak >= 3 ? DateTime.now() : null,
      ),
      Tasmee3Badge(
        type: Tasmee3BadgeType.sevenDayStreak,
        title: 'أسبوع من الثبات',
        description: 'حافظت على التسميع 7 أيام متتالية.',
        unlocked: streak >= 7,
        unlockedAt: streak >= 7 ? DateTime.now() : null,
      ),
      Tasmee3Badge(
        type: Tasmee3BadgeType.tenSessions,
        title: 'عشر جلسات',
        description: 'أكملت 10 جلسات تسميع.',
        unlocked: sessions.length >= 10,
        unlockedAt: sessions.length >= 10 ? DateTime.now() : null,
      ),
      Tasmee3Badge(
        type: Tasmee3BadgeType.highAccuracy,
        title: 'دقة عالية',
        description: 'حققت دقة 95% أو أكثر في جلسة.',
        unlocked: hasHighAccuracy,
        unlockedAt: hasHighAccuracy ? DateTime.now() : null,
      ),
      Tasmee3Badge(
        type: Tasmee3BadgeType.reviewHero,
        title: 'مراجعة متقنة',
        description: 'أكملت جلسة بدون أخطاء ظاهرة.',
        unlocked: hasReviewHero,
        unlockedAt: hasReviewHero ? DateTime.now() : null,
      ),
    ];
  }
}
