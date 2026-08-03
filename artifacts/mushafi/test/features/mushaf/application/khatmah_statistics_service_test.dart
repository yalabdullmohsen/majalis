import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/application/khatmah_statistics_service.dart';
import 'package:mushafi/features/mushaf/domain/khatmah_plan.dart';
import 'package:mushafi/features/mushaf/domain/khatmah_plan_status.dart';
import 'package:mushafi/features/mushaf/domain/khatmah_reading_log.dart';

void main() {
  group('KhatmahStatisticsService', () {
    test('builds statistics', () {
      const service = KhatmahStatisticsService();

      final now = DateTime.now();

      final stats = service.build(
        plans: [
          KhatmahPlan.newPlan(
            title: 'ختمة',
            targetDays: 30,
          ),
          KhatmahPlan.newPlan(
            title: 'مكتملة',
            targetDays: 30,
          ).copyWith(status: KhatmahPlanStatus.completed),
        ],
        logs: [
          KhatmahReadingLog(
            id: '1',
            planId: 'p',
            fromPage: 1,
            toPage: 5,
            pagesCount: 5,
            readAt: now,
          ),
        ],
      );

      expect(stats.pagesToday, 5);
      expect(stats.pagesThisWeek, 5);
      expect(stats.activePlansCount, 1);
      expect(stats.completedPlansCount, 1);
    });
  });
}
