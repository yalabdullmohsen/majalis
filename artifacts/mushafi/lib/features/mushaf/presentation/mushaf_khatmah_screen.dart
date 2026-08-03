import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_controller.dart';
import '../application/mushaf_providers.dart';
import 'mushaf_screen.dart';

class MushafKhatmahScreen extends ConsumerWidget {
  const MushafKhatmahScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);
    final progress = state.khatmahProgress;

    return Tasmee3AppScaffold(
      title: 'الختمة',
      body: ListView(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        children: [
          Container(
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
                  'تقدم الختمة',
                  style: Tasmee3TextStyles.sectionTitle,
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                Text(
                  '${progress.progressPercent}%',
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
                    value: progress.progress,
                    minHeight: 10,
                    backgroundColor:
                        Tasmee3Colors.border.withValues(alpha: 0.35),
                    color: Tasmee3Colors.primary,
                  ),
                ),
                const SizedBox(height: Tasmee3Spacing.md),
                Text(
                  'آخر صفحة: ${progress.lastPage}',
                  textAlign: TextAlign.center,
                  style: Tasmee3TextStyles.secondary,
                ),
                Text(
                  'الصفحات المقروءة: ${progress.pagesRead} من ${progress.totalPages}',
                  textAlign: TextAlign.center,
                  style: Tasmee3TextStyles.secondary,
                ),
              ],
            ),
          ),
          const SizedBox(height: Tasmee3Spacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Tasmee3Colors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MushafScreen(
                    initialPage: progress.lastPage.clamp(1, 604),
                  ),
                ),
              );
            },
            icon: const Icon(Icons.menu_book_outlined),
            label: const Text('متابعة القراءة'),
          ),
          const SizedBox(height: Tasmee3Spacing.sm),
          OutlinedButton.icon(
            onPressed: () {
              _confirmReset(context, controller);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('بدء ختمة جديدة'),
          ),
        ],
      ),
    );
  }

  void _confirmReset(BuildContext context, MushafController controller) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('بدء ختمة جديدة'),
            content: const Text('سيتم تصفير تقدم الختمة. هل تريد المتابعة؟'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                onPressed: () async {
                  await controller.resetKhatmah();

                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                },
                child: const Text('تأكيد'),
              ),
            ],
          ),
        );
      },
    );
  }
}
