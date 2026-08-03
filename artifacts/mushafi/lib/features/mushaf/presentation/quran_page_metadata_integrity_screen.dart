import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';

class QuranPageMetadataIntegrityScreen extends ConsumerWidget {
  const QuranPageMetadataIntegrityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final report = ref.watch(quranPageMetadataIntegrityReportProvider);

    return Tasmee3AppScaffold(
      title: 'فحص صفحات المصحف',
      body: report.when(
        loading: () => const Tasmee3LoadingState(
          message: 'جاري فحص بيانات الصفحات...',
        ),
        error: (error, stackTrace) => Tasmee3ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(quranPageMetadataIntegrityReportProvider);
          },
        ),
        data: (data) {
          final color =
              data.isValid ? Tasmee3Colors.success : Tasmee3Colors.danger;

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
                  children: [
                    Icon(
                      data.isValid
                          ? Icons.verified_outlined
                          : Icons.error_outline,
                      color: color,
                      size: 48,
                    ),
                    const SizedBox(height: Tasmee3Spacing.md),
                    Text(
                      data.isValid
                          ? 'بيانات الصفحات سليمة'
                          : 'توجد مشاكل في بيانات الصفحات',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.sectionTitle.copyWith(
                        color: color,
                      ),
                    ),
                    const SizedBox(height: Tasmee3Spacing.md),
                    Text(
                      'عدد الصفحات: ${data.totalPages}',
                      style: Tasmee3TextStyles.body,
                    ),
                    Text(
                      'عدد الملاحظات: ${data.issues.length}',
                      style: Tasmee3TextStyles.body,
                    ),
                    if (!data.isValid) ...[
                      const SizedBox(height: Tasmee3Spacing.sm),
                      const Text(
                        'الملف الحالي placeholder للتطوير. قبل النشر يلزم metadata موثوق لـ 604 صفحة.',
                        textAlign: TextAlign.center,
                        style: Tasmee3TextStyles.secondary,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              if (data.issues.isEmpty)
                const Text(
                  'لم يتم العثور على مشاكل.',
                  textAlign: TextAlign.center,
                  style: Tasmee3TextStyles.secondary,
                )
              else
                ...data.issues.take(100).map((issue) {
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
                    child: Text(
                      '${issue.code}: ${issue.message}${issue.pageNumber == null ? '' : ' - صفحة ${issue.pageNumber}'}',
                      style: Tasmee3TextStyles.secondary,
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}
