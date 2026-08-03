import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';
import '../data/reciters_catalog.dart';

class MushafDownloadsScreen extends ConsumerWidget {
  const MushafDownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloads = ref.watch(mushafAudioDownloadsProvider);
    final repository = ref.watch(mushafAudioDownloadRepositoryProvider);

    return Tasmee3AppScaffold(
      title: 'تنزيلات الصوت',
      body: downloads.when(
        loading: () => const Tasmee3LoadingState(
          message: 'جاري تحميل التنزيلات...',
        ),
        error: (error, stackTrace) => Tasmee3ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(mushafAudioDownloadsProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const Tasmee3EmptyState(
              icon: Icons.download_outlined,
              title: 'لا توجد تنزيلات',
              message: 'نزّل آيات أو صفحات للاستماع دون إنترنت.',
            );
          }

          final totalBytes = items.fold<int>(
            0,
            (sum, item) => sum + item.fileSizeBytes,
          );

          final grouped = <String, int>{};

          for (final item in items) {
            grouped[item.reciterId] = (grouped[item.reciterId] ?? 0) + 1;
          }

          return ListView(
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
                      'إجمالي الملفات: ${items.length}',
                      style: Tasmee3TextStyles.sectionTitle,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'الحجم التقريبي: ${_formatBytes(totalBytes)}',
                      style: Tasmee3TextStyles.secondary,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'تنبيه: لا تستخدم إلا مصادر صوت مرخصة وموثوقة.',
                      style: Tasmee3TextStyles.secondary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              ...grouped.entries.map((entry) {
                final reciter = RecitersCatalog.byId(entry.key);

                return Container(
                  margin: const EdgeInsets.only(bottom: Tasmee3Spacing.sm),
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: ListTile(
                    leading: const Icon(
                      Icons.record_voice_over,
                      color: Tasmee3Colors.primary,
                    ),
                    title: Text(reciter.nameArabic),
                    subtitle: Text('${entry.value} ملف صوتي'),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        await repository.removeByReciter(entry.key);
                        ref.invalidate(mushafAudioDownloadsProvider);
                      },
                    ),
                  ),
                );
              }),
              const SizedBox(height: Tasmee3Spacing.lg),
              OutlinedButton.icon(
                onPressed: () async {
                  final confirmed = await _confirmClearAll(context);

                  if (confirmed != true) return;

                  await repository.clearAll();
                  ref.invalidate(mushafAudioDownloadsProvider);
                },
                icon: const Icon(Icons.delete_sweep_outlined),
                label: const Text('حذف كل التنزيلات'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<bool?> _confirmClearAll(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('حذف كل التنزيلات'),
            content: const Text(
              'سيتم حذف جميع ملفات الصوت المنزلة من الجهاز. هل تريد المتابعة؟',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Tasmee3Colors.danger,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('حذف'),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';

    final kb = bytes / 1024;

    if (kb < 1024) return '${kb.toStringAsFixed(1)} KB';

    final mb = kb / 1024;

    return '${mb.toStringAsFixed(1)} MB';
  }
}
