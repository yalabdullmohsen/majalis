import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/quran_integrity_report.dart';
import '../domain/tasmee3_app_info.dart';
import '../domain/tasmee3_bug_report_category.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_session_record.dart';
import '../domain/tasmee3_user_asr_settings.dart';
import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_app_scaffold.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3BugReportScreen extends ConsumerStatefulWidget {
  const Tasmee3BugReportScreen({super.key});

  @override
  ConsumerState<Tasmee3BugReportScreen> createState() =>
      _Tasmee3BugReportScreenState();
}

class _Tasmee3BugReportScreenState
    extends ConsumerState<Tasmee3BugReportScreen> {
  Tasmee3BugReportCategory category = Tasmee3BugReportCategory.other;
  final TextEditingController descriptionController = TextEditingController();

  @override
  void dispose() {
    descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
        title: 'الإبلاغ عن مشكلة',
        body: Tasmee3LoadingState(
          message: 'جاري تجهيز نموذج المشكلة...',
        ),
      );
    }

    final firstError = appInfoAsync.error ??
        sessionsAsync.error ??
        settingsAsync.error ??
        goalAsync.error;

    if (firstError != null) {
      return Tasmee3AppScaffold(
        title: 'الإبلاغ عن مشكلة',
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
      title: 'الإبلاغ عن مشكلة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          const Text(
            'لن يتم إرسال أي بيانات تلقائيا. سيتم نسخ التقرير إلى الحافظة، ويمكنك إرساله للدعم يدويا.',
            style: Tasmee3TextStyles.secondary,
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          DropdownButtonFormField<Tasmee3BugReportCategory>(
            value: category,
            decoration: const InputDecoration(
              labelText: 'نوع المشكلة',
              border: OutlineInputBorder(),
            ),
            items: Tasmee3BugReportCategory.values.map((item) {
              return DropdownMenuItem(
                value: item,
                child: Text(item.arabicLabel),
              );
            }).toList(),
            onChanged: (value) {
              if (value == null) return;
              setState(() => category = value);
            },
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          TextFormField(
            controller: descriptionController,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'وصف المشكلة',
              hintText:
                  'اكتب ماذا حدث، ومتى ظهرت المشكلة، وما الخطوات التي سبقتها.',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () async {
              await _copyBugReport(
                context,
                appInfo: appInfo,
                sessions: sessions,
                settings: settings,
                goal: goal,
                quranReport: quranReport,
              );
            },
            icon: const Icon(Icons.copy),
            label: const Text('نسخ تقرير المشكلة'),
          ),
          const SizedBox(height: Tasmee3Spacing.md),
          const Text(
            'تأكد من عدم إضافة تسجيلات صوتية أو مفاتيح API أو بيانات خاصة داخل وصف المشكلة. التقرير لا يحتوي نص القرآن ولا يُرسل لأي خادم.',
            textAlign: TextAlign.center,
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }

  Future<void> _copyBugReport(
    BuildContext context, {
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

    final builder = ref.read(tasmee3BugReportBuilderProvider);

    final report = builder.build(
      appInfo: appInfo,
      category: category,
      userDescription: descriptionController.text,
      diagnostics: diagnostics,
    );

    await Clipboard.setData(ClipboardData(text: report));

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم نسخ تقرير المشكلة.'),
        ),
      );
    }
  }
}
