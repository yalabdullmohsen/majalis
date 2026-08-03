import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';
import '../domain/khatmah_plan_status.dart';

class KhatmahArchiveScreen extends ConsumerWidget {
  const KhatmahArchiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(khatmahPlanControllerProvider);
    final controller = ref.read(khatmahPlanControllerProvider.notifier);
    final archived = state.plans
        .where(
          (plan) =>
              plan.status == KhatmahPlanStatus.completed ||
              plan.status == KhatmahPlanStatus.archived ||
              plan.status == KhatmahPlanStatus.paused,
        )
        .toList();

    return Tasmee3AppScaffold(
      title: 'أرشيف الختمات',
      body: archived.isEmpty
          ? const Tasmee3EmptyState(
              icon: Icons.archive_outlined,
              title: 'لا توجد ختمات مؤرشفة',
              message: 'ستظهر هنا الختمات المكتملة أو المتوقفة.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(Tasmee3Spacing.lg),
              itemCount: archived.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final plan = archived[index];

                return Container(
                  padding: const EdgeInsets.all(Tasmee3Spacing.md),
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        plan.title,
                        style: Tasmee3TextStyles.sectionTitle.copyWith(
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text('الحالة: ${plan.status.arabicLabel}'),
                      Text('التقدم: ${plan.progressPercent}%'),
                      Text('الصفحات المقروءة: ${plan.pagesRead}'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (plan.status == KhatmahPlanStatus.paused)
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  controller.resumePlan(plan.id);
                                },
                                icon: const Icon(Icons.play_arrow),
                                label: const Text('استئناف'),
                              ),
                            ),
                          if (plan.status == KhatmahPlanStatus.paused)
                            const SizedBox(width: 8),
                          Expanded(
                            child: TextButton.icon(
                              onPressed: () {
                                controller.archivePlan(plan.id);
                              },
                              icon: const Icon(Icons.archive_outlined),
                              label: const Text('أرشفة'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
