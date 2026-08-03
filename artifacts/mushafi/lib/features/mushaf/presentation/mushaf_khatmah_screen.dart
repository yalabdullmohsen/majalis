import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/khatmah_plan_controller.dart';
import '../application/mushaf_providers.dart';
import '../domain/khatmah_plan.dart';
import 'khatmah_archive_screen.dart';
import 'khatmah_create_plan_screen.dart';
import 'khatmah_reminder_settings_screen.dart';
import 'mushaf_design_tokens.dart';
import 'mushaf_screen.dart';

class MushafKhatmahScreen extends ConsumerWidget {
  const MushafKhatmahScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(khatmahPlanControllerProvider);
    final controller = ref.read(khatmahPlanControllerProvider.notifier);
    final active = state.activePlan;

    return Tasmee3AppScaffold(
      title: 'الختمة',
      actions: [
        IconButton(
          tooltip: 'تذكير الختمة',
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const KhatmahReminderSettingsScreen(),
              ),
            );
          },
        ),
        IconButton(
          tooltip: 'الأرشيف',
          icon: const Icon(Icons.archive_outlined),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const KhatmahArchiveScreen(),
              ),
            );
          },
        ),
      ],
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : active == null
              ? Tasmee3EmptyState(
                  icon: Icons.menu_book_outlined,
                  title: 'لا توجد ختمة نشطة',
                  message: 'أنشئ خطة ختمة لتتابع وردك اليومي.',
                  actionLabel: 'إنشاء خطة',
                  onAction: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const KhatmahCreatePlanScreen(),
                      ),
                    );
                  },
                )
              : ListView(
                  padding: const EdgeInsets.all(MushafSpacing.lg),
                  children: [
                    _ActivePlanCard(plan: active),
                    const SizedBox(height: MushafSpacing.md),
                    if (active.isLate)
                      Container(
                        margin:
                            const EdgeInsets.only(bottom: MushafSpacing.md),
                        padding: const EdgeInsets.all(MushafSpacing.md),
                        decoration: BoxDecoration(
                          color: MushafColors.warning.withValues(alpha: 0.08),
                          borderRadius:
                              BorderRadius.circular(MushafRadius.md),
                          border: Border.all(
                            color:
                                MushafColors.warning.withValues(alpha: 0.25),
                          ),
                        ),
                        child: Text(
                          'متأخر ${active.lateByPages} صفحة عن الخطة.',
                          textAlign: TextAlign.center,
                          style: MushafTextStyles.secondary.copyWith(
                            color: MushafColors.warning,
                          ),
                        ),
                      ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MushafColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MushafScreen(
                              initialPage: active.currentPage,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.menu_book_outlined),
                      label: const Text('متابعة القراءة'),
                    ),
                    const SizedBox(height: MushafSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () {
                        _showMarkReadDialog(context, controller, active);
                      },
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('تسجيل صفحات'),
                    ),
                    const SizedBox(height: MushafSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const KhatmahReminderSettingsScreen(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.notifications_outlined),
                            label: const Text('التذكير'),
                          ),
                        ),
                        const SizedBox(width: MushafSpacing.sm),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const KhatmahArchiveScreen(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.archive_outlined),
                            label: const Text('الأرشيف'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: MushafSpacing.lg),
                    _StatsCard(state: state),
                    const SizedBox(height: MushafSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const KhatmahCreatePlanScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.add),
                      label: const Text('خطة جديدة'),
                    ),
                  ],
                ),
    );
  }

  void _showMarkReadDialog(
    BuildContext context,
    KhatmahPlanController controller,
    KhatmahPlan plan,
  ) {
    var fromPage = plan.currentPage;
    var toPage = (plan.currentPage + plan.dailyPagesTarget - 1)
        .clamp(1, plan.totalPages);

    showDialog<void>(
      context: context,
      builder: (context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: StatefulBuilder(
            builder: (context, setState) {
              return AlertDialog(
                title: const Text('تسجيل قراءة'),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('من صفحة: $fromPage'),
                    Slider(
                      value: fromPage.toDouble(),
                      min: 1,
                      max: plan.totalPages.toDouble(),
                      divisions: plan.totalPages - 1,
                      label: '$fromPage',
                      onChanged: (value) {
                        setState(() {
                          fromPage = value.round();
                          if (toPage < fromPage) {
                            toPage = fromPage;
                          }
                        });
                      },
                    ),
                    Text('إلى صفحة: $toPage'),
                    Slider(
                      value: toPage.toDouble(),
                      min: 1,
                      max: plan.totalPages.toDouble(),
                      divisions: plan.totalPages - 1,
                      label: '$toPage',
                      onChanged: (value) {
                        setState(() {
                          toPage = value.round();
                          if (fromPage > toPage) {
                            fromPage = toPage;
                          }
                        });
                      },
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('إلغاء'),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      await controller.markPagesRead(
                        fromPage: fromPage,
                        toPage: toPage,
                      );

                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                    },
                    child: const Text('تسجيل'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

class _ActivePlanCard extends StatelessWidget {
  final KhatmahPlan plan;

  const _ActivePlanCard({
    required this.plan,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(plan.title, style: Tasmee3TextStyles.sectionTitle),
          const SizedBox(height: Tasmee3Spacing.md),
          Text(
            '${plan.progressPercent}%',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.title.copyWith(
              color: Tasmee3Colors.primary,
              fontSize: 34,
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(Tasmee3Radius.pill),
            child: LinearProgressIndicator(
              value: plan.progress,
              minHeight: 10,
              color: Tasmee3Colors.primary,
              backgroundColor: Tasmee3Colors.border.withValues(alpha: 0.35),
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          Text(
            'الورد اليومي: ${plan.dailyPagesTarget} صفحة',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
          Text(
            'المتبقي: ${plan.remainingPages} صفحة',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
          Text(
            'آخر صفحة: ${plan.currentPage}',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }
}

class _StatsCard extends StatelessWidget {
  final KhatmahPlanState state;

  const _StatsCard({
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    final stats = state.statistics;

    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('إحصائيات القراءة', style: Tasmee3TextStyles.sectionTitle),
          const SizedBox(height: Tasmee3Spacing.md),
          Text('صفحات اليوم: ${stats.pagesToday}'),
          Text('صفحات آخر 7 أيام: ${stats.pagesThisWeek}'),
          Text(
            'متوسط الصفحات اليومي: ${stats.averagePagesPerDay.toStringAsFixed(1)}',
          ),
          Text('الختمات المكتملة: ${stats.completedPlansCount}'),
        ],
      ),
    );
  }
}
