import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';

class MushafAyahReviewScreen extends ConsumerWidget {
  final int surah;
  final int ayah;

  const MushafAyahReviewScreen({
    super.key,
    required this.surah,
    required this.ayah,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final markers = ref.watch(mushafReviewMarkersProvider);

    return Tasmee3AppScaffold(
      title: 'مراجعة الآية',
      body: markers.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text(error.toString())),
        data: (items) {
          final ayahMarkers = items.where((item) {
            return item.surah == surah && item.ayah == ayah;
          }).toList();

          if (ayahMarkers.isEmpty) {
            return const Tasmee3EmptyState(
              icon: Icons.check_circle_outline,
              title: 'لا توجد ملاحظات مراجعة',
              message: 'لا توجد أخطاء محفوظة لهذه الآية.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            itemCount: ayahMarkers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final marker = ayahMarkers[index];

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
                    Text(
                      'سورة ${marker.surah} - آية ${marker.ayah}',
                      style: Tasmee3TextStyles.sectionTitle,
                    ),
                    const SizedBox(height: 8),
                    Text('عدد الملاحظات: ${marker.mistakesCount}'),
                    Text(
                      'الدقة التقريبية: ${(marker.accuracy * 100).round()}%',
                    ),
                    Text('آخر تحديث: ${marker.updatedAt.toLocal()}'),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () async {
                        await ref
                            .read(mushafReviewMarkerRepositoryProvider)
                            .removeForAyah(
                              surah: marker.surah,
                              ayah: marker.ayah,
                            );

                        ref.invalidate(mushafReviewMarkersProvider);
                      },
                      icon: const Icon(Icons.check),
                      label: const Text('اعتبارها مراجعة تمت'),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
