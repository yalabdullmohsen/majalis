import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/quran_integrity_report.dart';
import 'tasmee3_design_tokens.dart';
import 'widgets/tasmee3_app_scaffold.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class QuranIntegrityScreen extends ConsumerWidget {
  const QuranIntegrityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final report = ref.watch(quranIntegrityReportProvider);

    return Tasmee3AppScaffold(
      title: 'فحص ملف القرآن',
      body: report.when(
        loading: () => const Tasmee3LoadingState(
          message: 'جاري فحص ملف القرآن...',
        ),
        error: (error, stackTrace) => Tasmee3ErrorState(
          message: ref.read(tasmee3ErrorMapperProvider).map(error),
          onRetry: () {
            ref.invalidate(quranIntegrityReportProvider);
          },
        ),
        data: (data) => _ReportView(report: data),
      ),
    );
  }
}

class _ReportView extends StatelessWidget {
  final QuranIntegrityReport report;

  const _ReportView({
    required this.report,
  });

  @override
  Widget build(BuildContext context) {
    final color =
        report.isValid ? Tasmee3Colors.success : Tasmee3Colors.danger;

    return ListView(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      children: [
        Container(
          padding: const EdgeInsets.all(Tasmee3Spacing.lg),
          decoration: BoxDecoration(
            color: Tasmee3Colors.surface,
            borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
            border: Border.all(color: color.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                report.isValid
                    ? Icons.verified_outlined
                    : Icons.error_outline,
                color: color,
                size: 48,
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              Text(
                report.statusLabel,
                textAlign: TextAlign.center,
                style: Tasmee3TextStyles.sectionTitle.copyWith(
                  color: color,
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              _InfoLine(label: 'عدد السور', value: '${report.totalSurahs}'),
              _InfoLine(label: 'عدد الآيات', value: '${report.totalAyahs}'),
              _InfoLine(
                label: 'الآيات الفارغة',
                value: '${report.emptyAyahsCount}',
              ),
              _InfoLine(
                label: 'المكررات',
                value: '${report.duplicateAyahsCount}',
              ),
              _InfoLine(
                label: 'عدد الملاحظات',
                value: '${report.issuesCount}',
              ),
            ],
          ),
        ),
        const SizedBox(height: Tasmee3Spacing.lg),
        if (report.issues.isEmpty)
          Container(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: const Text(
              'لم يتم العثور على مشاكل في ملف القرآن.',
              textAlign: TextAlign.center,
              style: Tasmee3TextStyles.body,
            ),
          )
        else
          ...report.issues.take(100).map((issue) {
            return Container(
              margin: const EdgeInsets.only(bottom: Tasmee3Spacing.sm),
              padding: const EdgeInsets.all(Tasmee3Spacing.md),
              decoration: BoxDecoration(
                color: Tasmee3Colors.surface,
                borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                border: Border.all(
                  color: Tasmee3Colors.danger.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    issue.code,
                    style: Tasmee3TextStyles.sectionTitle.copyWith(
                      fontSize: 15,
                      color: Tasmee3Colors.danger,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    issue.message,
                    style: Tasmee3TextStyles.secondary,
                  ),
                  if (issue.surah != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'الموضع: سورة ${issue.surah}${issue.ayah == null ? '' : ' - آية ${issue.ayah}'}',
                      style: Tasmee3TextStyles.secondary,
                    ),
                  ],
                ],
              ),
            );
          }),
        const SizedBox(height: Tasmee3Spacing.lg),
        const Text(
          'هذا فحص تقني لسلامة الملف. لا يغني عن المراجعة العلمية المعتمدة، ولا يتم توليد نص القرآن بالذكاء الاصطناعي.',
          textAlign: TextAlign.center,
          style: Tasmee3TextStyles.secondary,
        ),
      ],
    );
  }
}

class _InfoLine extends StatelessWidget {
  final String label;
  final String value;

  const _InfoLine({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Tasmee3Spacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Tasmee3TextStyles.secondary,
            ),
          ),
          Text(
            value,
            style: Tasmee3TextStyles.body.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
