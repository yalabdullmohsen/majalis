import '../domain/khatmah_plan.dart';
import '../domain/khatmah_plan_status.dart';
import '../domain/khatmah_reading_log.dart';
import '../domain/khatmah_statistics.dart';

class KhatmahStatisticsService {
  const KhatmahStatisticsService();

  KhatmahStatistics build({
    required List<KhatmahPlan> plans,
    required List<KhatmahReadingLog> logs,
  }) {
    final pagesToday = logs
        .where((log) => log.isToday)
        .fold<int>(0, (sum, log) => sum + log.pagesCount);

    final pagesThisWeek = logs
        .where((log) => log.isThisWeek)
        .fold<int>(0, (sum, log) => sum + log.pagesCount);

    final daysWithLogs = logs
        .map((log) => DateTime(log.readAt.year, log.readAt.month, log.readAt.day))
        .toSet()
        .length;

    final totalPages = logs.fold<int>(0, (sum, log) => sum + log.pagesCount);

    final average = daysWithLogs == 0 ? 0.0 : totalPages / daysWithLogs;

    final activePlans = plans
        .where((plan) => plan.status == KhatmahPlanStatus.active)
        .length;

    final completedPlans = plans
        .where((plan) => plan.status == KhatmahPlanStatus.completed)
        .length;

    return KhatmahStatistics(
      pagesToday: pagesToday,
      pagesThisWeek: pagesThisWeek,
      averagePagesPerDay: average,
      activePlansCount: activePlans,
      completedPlansCount: completedPlans,
    );
  }
}
