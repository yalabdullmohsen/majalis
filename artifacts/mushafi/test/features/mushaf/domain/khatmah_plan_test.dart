import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/domain/khatmah_plan.dart';
import 'package:mushafi/features/mushaf/domain/khatmah_plan_status.dart';

void main() {
  group('KhatmahPlan', () {
    test('calculates daily pages target', () {
      final plan = KhatmahPlan.newPlan(
        title: 'اختبار',
        targetDays: 30,
      );

      expect(plan.dailyPagesTarget, 21);
    });

    test('calculates progress', () {
      final plan = KhatmahPlan.newPlan(
        title: 'اختبار',
        targetDays: 30,
      ).copyWith(
        pagesRead: 302,
      );

      expect(plan.progressPercent, 50);
    });

    test('detects completed status', () {
      final plan = KhatmahPlan.newPlan(
        title: 'اختبار',
        targetDays: 30,
      ).copyWith(
        pagesRead: 604,
        status: KhatmahPlanStatus.completed,
        completedAt: DateTime(2026),
      );

      expect(plan.isCompleted, true);
    });
  });
}
