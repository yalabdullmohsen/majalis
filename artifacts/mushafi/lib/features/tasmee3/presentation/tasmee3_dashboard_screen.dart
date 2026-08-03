import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_goal_progress.dart';
import 'tasmee3_asr_settings_screen.dart';
import 'tasmee3_badges_screen.dart';
import 'tasmee3_design_tokens.dart';
import 'tasmee3_goal_settings_screen.dart';
import 'tasmee3_history_screen.dart';
import 'tasmee3_limitations_screen.dart';
import 'tasmee3_privacy_screen.dart';
import 'tasmee3_reminders_screen.dart';
import 'tasmee3_review_plan_screen.dart';
import 'tasmee3_screen.dart';
import 'tasmee3_today_review_screen.dart';
import 'quran_sources_screen.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_goal_progress_card.dart';
import 'widgets/tasmee3_loading_state.dart';
import 'widgets/tasmee3_week_stats_card.dart';

class Tasmee3DashboardScreen extends ConsumerWidget {
  const Tasmee3DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tasmee3SessionHistoryProvider);
    final stats = ref.watch(tasmee3Last7DaysStatsProvider);
    final reviewPlan = ref.watch(tasmee3ReviewPlanProvider);
    final goalProgress = ref.watch(tasmee3TodayGoalProgressProvider);
    final streak = ref.watch(tasmee3StreakProvider);
    final dailyGoal = ref.watch(tasmee3DailyGoalProvider);
    final todayReview = ref.watch(tasmee3TodayReviewSuggestionsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Tasmee3Colors.background,
        appBar: AppBar(
          title: const Text('لوحة التسميع'),
          centerTitle: true,
          backgroundColor: Tasmee3Colors.background,
          foregroundColor: Tasmee3Colors.text,
          elevation: 0,
          actions: [
            IconButton(
              tooltip: 'إعدادات محرك التسميع',
              icon: const Icon(Icons.settings_outlined),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const Tasmee3AsrSettingsScreen(),
                  ),
                );
              },
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(Tasmee3Spacing.lg),
          children: [
            history.when(
              loading: () => _heroCard(context, hasSessions: true),
              error: (_, __) => _heroCard(context, hasSessions: true),
              data: (sessions) =>
                  _heroCard(context, hasSessions: sessions.isNotEmpty),
            ),
            const SizedBox(height: Tasmee3Spacing.md),
            goalProgress.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) =>
                  Tasmee3ErrorState(message: error.toString()),
              data: (progress) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Tasmee3GoalProgressCard(progress: progress),
                  if (progress.completed) ...[
                    const SizedBox(height: Tasmee3Spacing.sm),
                    _goalCompletedBanner(),
                  ],
                ],
              ),
            ),
            dailyGoal.maybeWhen(
              data: (goal) {
                if (!goal.reminderEnabled) {
                  return const SizedBox.shrink();
                }

                return Padding(
                  padding: const EdgeInsets.only(top: Tasmee3Spacing.md),
                  child: _reminderCard(goal.reminderTime, goalProgress),
                );
              },
              orElse: () => const SizedBox.shrink(),
            ),
            const SizedBox(height: Tasmee3Spacing.md),
            streak.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) =>
                  Tasmee3ErrorState(message: error.toString()),
              data: (value) => _streakCard(value),
            ),
            todayReview.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (items) {
                if (items.isEmpty) {
                  return const SizedBox.shrink();
                }

                final first = items.first;

                return Container(
                  margin: const EdgeInsets.only(top: Tasmee3Spacing.md),
                  padding: const EdgeInsets.all(Tasmee3Spacing.lg),
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'المراجعة المقترحة الآن',
                        style: Tasmee3TextStyles.sectionTitle,
                      ),
                      const SizedBox(height: Tasmee3Spacing.sm),
                      Text(
                        first.rangeLabel,
                        style: Tasmee3TextStyles.secondary,
                      ),
                      const SizedBox(height: Tasmee3Spacing.md),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Tasmee3Colors.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () {
                          final mapper =
                              ref.read(tasmee3ReviewSuggestionMapperProvider);

                          final target = mapper.toTarget(
                            first,
                            mode: Tasmee3Mode.hifzTest,
                          );

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => Tasmee3Screen(
                                initialTarget: target,
                                startInHifzMode: true,
                                showExpectedTextFirst: true,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('ابدأ المراجعة المقترحة'),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: Tasmee3Spacing.md),
            stats.when(
              loading: () => const Tasmee3LoadingState(
                message: 'جاري تحميل الإحصاءات...',
              ),
              error: (error, stackTrace) =>
                  Tasmee3ErrorState(message: error.toString()),
              data: (items) => Tasmee3WeekStatsCard(stats: items),
            ),
            const SizedBox(height: Tasmee3Spacing.md),
            history.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) =>
                  Tasmee3ErrorState(message: error.toString()),
              data: (sessions) {
                final total = sessions.length;
                final avg = sessions.isEmpty
                    ? 0
                    : (sessions
                                .map((e) => e.accuracyPercent)
                                .reduce((a, b) => a + b) /
                            sessions.length)
                        .round();

                return _summaryCard(
                  totalSessions: total,
                  averageAccuracy: avg,
                );
              },
            ),
            const SizedBox(height: Tasmee3Spacing.md),
            reviewPlan.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) =>
                  Tasmee3ErrorState(message: error.toString()),
              data: (items) => _reviewPlanPreview(context, items.length),
            ),
            const SizedBox(height: Tasmee3Spacing.lg),
            _quickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _goalCompletedBanner() {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.md),
      decoration: BoxDecoration(
        color: Tasmee3Colors.success.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(Tasmee3Radius.md),
        border: Border.all(
          color: Tasmee3Colors.success.withValues(alpha: 0.25),
        ),
      ),
      child: const Row(
        children: [
          Icon(Icons.check_circle_outline, color: Tasmee3Colors.success),
          SizedBox(width: Tasmee3Spacing.sm),
          Expanded(
            child: Text(
              'أحسنت! اكتمل هدفك اليومي. يمكنك مواصلة التسميع للمراجعة.',
              style: TextStyle(
                color: Tasmee3Colors.text,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _reminderCard(
    String time,
    AsyncValue<Tasmee3GoalProgress> goalProgress,
  ) {
    final incomplete = goalProgress.maybeWhen(
      data: (progress) => !progress.completed,
      orElse: () => true,
    );

    if (!incomplete) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8EE),
        borderRadius: BorderRadius.circular(Tasmee3Radius.md),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.notifications_active_outlined,
            color: Tasmee3Colors.primary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'تذكير التسميع مفعّل عند $time. لم يكتمل هدف اليوم بعد.',
              style: const TextStyle(
                color: Tasmee3Colors.text,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroCard(BuildContext context, {required bool hasSessions}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.xl),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            hasSessions ? 'مراجعة حفظك بهدوء' : 'ابدأ أول جلسة تسميع',
            style: Tasmee3TextStyles.title,
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          Text(
            hasSessions
                ? 'جلسة قصيرة تساعدك على مراجعة الحفظ ومواضع تحتاج متابعة.'
                : 'اختر سورة ونطاقا قصيرا، ثم ابدأ التسميع بصوت واضح.',
            style: Tasmee3TextStyles.secondary,
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const Tasmee3Screen()),
              );
            },
            icon: const Icon(Icons.mic),
            label: Text(hasSessions ? 'ابدأ تسميع جديد' : 'ابدأ أول جلسة'),
          ),
        ],
      ),
    );
  }

  Widget _streakCard(int streak) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.local_fire_department_outlined,
            color: Tasmee3Colors.primary,
            size: 34,
          ),
          const SizedBox(width: Tasmee3Spacing.md),
          Expanded(
            child: Text(
              streak == 0
                  ? 'ابدأ اليوم لبناء سلسلة التسميع.'
                  : 'سلسلة التسميع الحالية: $streak يوم',
              style: const TextStyle(
                color: Tasmee3Colors.text,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryCard({
    required int totalSessions,
    required int averageAccuracy,
  }) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _numberTile(
              title: 'الجلسات',
              value: '$totalSessions',
            ),
          ),
          Expanded(
            child: _numberTile(
              title: 'متوسط الدقة التقريبية',
              value: '$averageAccuracy%',
            ),
          ),
        ],
      ),
    );
  }

  Widget _numberTile({
    required String title,
    required String value,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Tasmee3Colors.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Tasmee3TextStyles.secondary,
        ),
      ],
    );
  }

  Widget _reviewPlanPreview(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.assignment_outlined,
            color: Tasmee3Colors.primary,
          ),
          const SizedBox(width: Tasmee3Spacing.md),
          Expanded(
            child: Text(
              count == 0
                  ? 'لا توجد خطة مراجعة أسبوعية حاليا.'
                  : 'خطة الأسبوع: $count موضعا مقترحا للمراجعة.',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Tasmee3Colors.text,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const Tasmee3ReviewPlanScreen(),
                ),
              );
            },
            child: const Text('عرض'),
          ),
        ],
      ),
    );
  }

  Widget _quickActions(BuildContext context) {
    Widget action({
      required IconData icon,
      required String label,
      required Widget screen,
    }) {
      return Expanded(
        child: OutlinedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => screen),
            );
          },
          icon: Icon(icon),
          label: Text(label),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('اختصارات', style: Tasmee3TextStyles.sectionTitle),
        const SizedBox(height: Tasmee3Spacing.sm),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Tasmee3Colors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const Tasmee3Screen()),
                  );
                },
                icon: const Icon(Icons.mic),
                label: const Text('ابدأ تسميع'),
              ),
            ),
            const SizedBox(width: 10),
            action(
              icon: Icons.auto_awesome,
              label: 'مراجعة اليوم',
              screen: const Tasmee3TodayReviewScreen(),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            action(
              icon: Icons.history,
              label: 'السجل',
              screen: const Tasmee3HistoryScreen(),
            ),
            const SizedBox(width: 10),
            action(
              icon: Icons.track_changes,
              label: 'الأهداف',
              screen: const Tasmee3GoalSettingsScreen(),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            action(
              icon: Icons.notifications_active_outlined,
              label: 'التذكيرات',
              screen: const Tasmee3RemindersScreen(),
            ),
            const SizedBox(width: 10),
            action(
              icon: Icons.settings_outlined,
              label: 'الإعدادات',
              screen: const Tasmee3AsrSettingsScreen(),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            action(
              icon: Icons.privacy_tip_outlined,
              label: 'الخصوصية',
              screen: const Tasmee3PrivacyScreen(),
            ),
            const SizedBox(width: 10),
            action(
              icon: Icons.workspace_premium_outlined,
              label: 'الإنجازات',
              screen: const Tasmee3BadgesScreen(),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            action(
              icon: Icons.source_outlined,
              label: 'مصادر القرآن',
              screen: const QuranSourcesScreen(),
            ),
            const SizedBox(width: 10),
            action(
              icon: Icons.info_outline,
              label: 'حدود التسميع',
              screen: const Tasmee3LimitationsScreen(),
            ),
          ],
        ),
        const SizedBox(height: Tasmee3Spacing.md),
        const Text(
          'التسميع أداة مساعدة تقنية بدقة تقريبية، وليست حكما شرعيا على التلاوة.',
          textAlign: TextAlign.center,
          style: Tasmee3TextStyles.secondary,
        ),
      ],
    );
  }
}
