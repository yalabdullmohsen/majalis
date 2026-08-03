import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/tasmee3_review_plan_item.dart';
import 'widgets/tasmee3_empty_state.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3ReviewPlanScreen extends ConsumerWidget {
  const Tasmee3ReviewPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plan = ref.watch(tasmee3ReviewPlanProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('خطة المراجعة'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: plan.when(
          loading: () => const Tasmee3LoadingState(
            message: 'جاري تجهيز خطة المراجعة...',
          ),
          error: (error, stackTrace) => Tasmee3ErrorState(
            message: 'تعذر تحميل خطة المراجعة.',
            onRetry: () => ref.invalidate(tasmee3ReviewPlanProvider),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Tasmee3EmptyState(
                icon: Icons.calendar_month_outlined,
                title: 'لا مواضع مراجعة حاليا',
                message:
                    'أكمل بعض جلسات التسميع أولا ليبدأ التطبيق باقتراح مواضع تحتاج مراجعة.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = items[index];
                final color = _color(item);

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFCF7),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: color.withValues(alpha: 0.25)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: color.withValues(alpha: 0.12),
                        child: Text(
                          '${item.recommendedRepeats}x',
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'سورة ${item.ayahRef.surah} - آية ${item.ayahRef.ayah}',
                              style: const TextStyle(
                                color: Color(0xFF11100E),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'الأولوية: ${item.priorityLabel}',
                              style: TextStyle(
                                color: color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.reason,
                              style: const TextStyle(
                                color: Color(0xFF9A8068),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Color _color(Tasmee3ReviewPlanItem item) {
    switch (item.priority) {
      case ReviewPriority.high:
        return Colors.red.shade700;
      case ReviewPriority.medium:
        return Colors.orange.shade800;
      case ReviewPriority.low:
        return Colors.green.shade700;
    }
  }
}
