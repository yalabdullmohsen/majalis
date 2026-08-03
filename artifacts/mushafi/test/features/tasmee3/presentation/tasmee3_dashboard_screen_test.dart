import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_providers.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_daily_goal.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_daily_stats.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_goal_progress.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_review_plan_item.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_review_suggestion.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_session_record.dart';
import 'package:mushafi/features/tasmee3/presentation/tasmee3_dashboard_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Tasmee3DashboardScreen renders', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tasmee3SessionHistoryProvider.overrideWith(
            (ref) async => <Tasmee3SessionRecord>[],
          ),
          tasmee3Last7DaysStatsProvider.overrideWith(
            (ref) async => <Tasmee3DailyStats>[],
          ),
          tasmee3ReviewPlanProvider.overrideWith(
            (ref) async => <Tasmee3ReviewPlanItem>[],
          ),
          tasmee3TodayReviewSuggestionsProvider.overrideWith(
            (ref) async => <Tasmee3ReviewSuggestion>[],
          ),
          tasmee3DailyGoalProvider.overrideWith(
            (ref) async => const Tasmee3DailyGoal.defaults(),
          ),
          tasmee3TodayGoalProgressProvider.overrideWith(
            (ref) async => const Tasmee3GoalProgress(
              goal: Tasmee3DailyGoal.defaults(),
              currentValue: 0,
              targetValue: 1,
            ),
          ),
          tasmee3StreakProvider.overrideWith((ref) async => 0),
        ],
        child: const MaterialApp(
          home: Tasmee3DashboardScreen(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('لوحة التسميع'), findsOneWidget);
  });
}
