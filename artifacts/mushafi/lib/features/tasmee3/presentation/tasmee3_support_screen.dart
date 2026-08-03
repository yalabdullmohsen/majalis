import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/quran_integrity_report.dart';
import '../domain/tasmee3_app_info.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_session_record.dart';
import '../domain/tasmee3_user_asr_settings.dart';
import 'tasmee3_bug_report_screen.dart';
import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_app_scaffold.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3SupportScreen extends ConsumerWidget {
  const Tasmee3SupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appInfoAsync = ref.watch(tasmee3AppInfoProvider);
    final sessionsAsync = ref.watch(tasmee3SessionHistoryProvider);
    final settingsAsync = ref.watch(tasmee3UserAsrSettingsProvider);
    final goalAsync = ref.watch(tasmee3DailyGoalProvider);
    final quranAsync = ref.watch(quranIntegrityReportProvider);

    if (appInfoAsync.isLoading ||
        sessionsAsync.isLoading ||
        settingsAsync.isLoading ||
        goalAsync.isLoading) {
      return const Tasmee3AppScaffold(
        title: 'الدعم والمساعدة',
        body: Tasmee3LoadingState(
          message: 'جاري تجهيز صفحة الدعم...',
        ),
      );
    }

    final firstError = appInfoAsync.error ??
        sessionsAsync.error ??
        settingsAsync.error ??
        goalAsync.error;

    if (firstError != null) {
      return Tasmee3AppScaffold(
        title: 'الدعم والمساعدة',
        body: Tasmee3ErrorState(
          message: ref.read(tasmee3ErrorMapperProvider).map(firstError),
          onRetry: () {
            ref.invalidate(tasmee3AppInfoProvider);
            ref.invalidate(tasmee3SessionHistoryProvider);
            ref.invalidate(tasmee3UserAsrSettingsProvider);
            ref.invalidate(tasmee3DailyGoalProvider);
            ref.invalidate(quranIntegrityReportProvider);
          },
        ),
      );
    }

    final appInfo = appInfoAsync.requireValue;
    final sessions = sessionsAsync.requireValue;
    final settings = settingsAsync.requireValue;
    final goal = goalAsync.requireValue;
    final QuranIntegrityReport? quranReport = quranAsync.asData?.value;

    return Tasmee3AppScaffold(
      title: 'الدعم والمساعدة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          const _SupportCard(
            title: 'قبل طلب الدعم',
            body:
                'جرّب إعادة تشغيل التطبيق، وتأكد من صلاحية الميكروفون، وتأكد من أن نطاق التسميع قصير وواضح.',
          ),
          const _SupportCard(
            title: 'مشاكل الخادم المتقدم',
            body:
                'إذا كان محرك التسميع المتقدم لا يعمل، تحقق من endpoint، الاتصال بالإنترنت، ومفتاح الوصول. يمكنك تعطيل الخادم واستخدام تعرف الجهاز عند توفره.',
          ),
          const _SupportCard(
            title: 'مشاكل دقة التسميع',
            body:
                'الدقة تقريبية وتتأثر بجودة الصوت والضوضاء وسرعة القراءة. للحصول على نتيجة أفضل استخدم نطاقا قصيرا واقرأ في مكان هادئ.',
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const Tasmee3BugReportScreen(),
                ),
              );
            },
            icon: const Icon(Icons.bug_report_outlined),
            label: const Text('الإبلاغ عن مشكلة'),
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () async {
              await _copyDiagnostics(
                context,
                ref,
                appInfo: appInfo,
                sessions: sessions,
                settings: settings,
                goal: goal,
                quranReport: quranReport,
              );
            },
            icon: const Icon(Icons.copy),
            label: const Text('نسخ معلومات التشخيص'),
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          OutlinedButton.icon(
            onPressed: () {
              _showResetDialog(context, ref);
            },
            icon: const Icon(Icons.delete_outline),
            label: const Text('إعادة ضبط بيانات التسميع المحلية'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          const Text(
            'معلومات التشخيص لا تحتوي على صوت، ولا تحتوي على نص القرآن، ولا تعرض مفتاح API. ولا تُرسل لأي خادم.',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }

  Future<void> _copyDiagnostics(
    BuildContext context,
    WidgetRef ref, {
    required Tasmee3AppInfo appInfo,
    required List<Tasmee3SessionRecord> sessions,
    required Tasmee3UserAsrSettings settings,
    required Tasmee3DailyGoal goal,
    required QuranIntegrityReport? quranReport,
  }) async {
    final diagnosticsService = ref.read(tasmee3DiagnosticsServiceProvider);

    final diagnostics = diagnosticsService.buildDiagnostics(
      appInfo: appInfo,
      sessions: sessions,
      asrSettings: settings,
      dailyGoal: goal,
      quranReport: quranReport,
    );

    await Clipboard.setData(ClipboardData(text: diagnostics));

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم نسخ معلومات التشخيص.'),
        ),
      );
    }
  }

  void _showResetDialog(BuildContext context, WidgetRef ref) {
    var resetOnboarding = false;
    var resetAsrSettings = false;

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: StatefulBuilder(
            builder: (context, setState) {
              return AlertDialog(
                title: const Text('إعادة ضبط بيانات التسميع'),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'سيتم حذف سجل التسميع، الأهداف، التذكيرات، وخطة المراجعة المحلية. لن يتم حذف ملف القرآن.',
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: resetAsrSettings,
                      title: const Text('حذف إعدادات محرك التسميع أيضا'),
                      onChanged: (value) {
                        setState(() {
                          resetAsrSettings = value ?? false;
                        });
                      },
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: resetOnboarding,
                      title: const Text('إظهار شاشة البداية مرة أخرى'),
                      onChanged: (value) {
                        setState(() {
                          resetOnboarding = value ?? false;
                        });
                      },
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: const Text('إلغاء'),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Tasmee3Colors.danger,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () async {
                      final resetService =
                          ref.read(tasmee3ResetServiceProvider);

                      await resetService.resetTasmee3LocalData(
                        resetOnboarding: resetOnboarding,
                        resetAsrSettings: resetAsrSettings,
                      );

                      ref.invalidate(tasmee3SessionHistoryProvider);
                      ref.invalidate(tasmee3TodayGoalProgressProvider);
                      ref.invalidate(tasmee3StreakProvider);
                      ref.invalidate(tasmee3BadgesProvider);
                      ref.invalidate(tasmee3Last7DaysStatsProvider);
                      ref.invalidate(tasmee3ReviewPlanProvider);
                      ref.invalidate(ayahMasteryRecordsProvider);
                      ref.invalidate(tasmee3TodayReviewSuggestionsProvider);
                      ref.invalidate(tasmee3DailyGoalProvider);
                      ref.invalidate(tasmee3RemindersProvider);
                      ref.invalidate(tasmee3UserAsrSettingsProvider);
                      ref.invalidate(tasmee3HasSeenOnboardingProvider);
                      ref.invalidate(tasmee3AchievementsProvider);
                      ref.invalidate(tasmee3NextRangeSuggestionProvider);

                      if (dialogContext.mounted) {
                        Navigator.pop(dialogContext);
                      }

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تمت إعادة ضبط بيانات التسميع.'),
                          ),
                        );
                      }
                    },
                    child: const Text('إعادة الضبط'),
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

class _SupportCard extends StatelessWidget {
  final String title;
  final String body;

  const _SupportCard({
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: Tasmee3Spacing.md),
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: Tasmee3TextStyles.sectionTitle,
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          Text(
            body,
            style: Tasmee3TextStyles.body,
          ),
        ],
      ),
    );
  }
}
