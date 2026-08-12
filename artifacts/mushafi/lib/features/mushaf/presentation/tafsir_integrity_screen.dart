import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';

class TafsirIntegrityScreen extends ConsumerWidget {
  const TafsirIntegrityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final report = ref.watch(tafsirIntegrityReportProvider);

    return Tasmee3AppScaffold(
      title: 'فحص ملف التفسير',
      body: report.when(
        loading: () => const Tasmee3LoadingState(
          message: 'جاري فحص ملف التفسير...',
        ),
        error: (error, stackTrace) => Tasmee3ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(tafsirIntegrityReportProvider),
        ),
        data: (data) {
          final color =
              data.isValid ? Tasmee3Colors.success : Tasmee3Colors.warning;

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
                          : Icons.info_outline,
                      color: color,
                      size: 48,
                    ),
                    const SizedBox(height: Tasmee3Spacing.md),
                    Text(
                      data.isValid
                          ? 'ملف التفسير متاح'
                          : 'ملف التفسير غير مكتمل أو فارغ',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.sectionTitle.copyWith(
                        color: color,
                      ),
                    ),
                    const SizedBox(height: Tasmee3Spacing.md),
                    Text('عدد المداخل: ${data.totalEntries}'),
                    Text('المداخل الفارغة: ${data.emptyEntries}'),
                    Text('المكررات: ${data.duplicateEntries}'),
                    Text('الملاحظات: ${data.issues.length}'),
                    const SizedBox(height: Tasmee3Spacing.sm),
                    const Text(
                      'لا يتم توليد التفسير بالذكاء الاصطناعي. استخدم مصدرا مرخصا وموثوقا فقط.',
                      textAlign: TextAlign.center,
                      style: Tasmee3TextStyles.secondary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              if (data.issues.isEmpty)
                const Text(
                  'لا توجد ملاحظات.',
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
                        color: Tasmee3Colors.warning.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Text(
                      '${issue.code}: ${issue.message}${issue.surah == null ? '' : ' - سورة ${issue.surah} آية ${issue.ayah}'}',
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
