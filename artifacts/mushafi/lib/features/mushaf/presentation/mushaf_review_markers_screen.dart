import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';
import 'mushaf_screen.dart';

class MushafReviewMarkersScreen extends ConsumerWidget {
  const MushafReviewMarkersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final markers = ref.watch(mushafReviewMarkersProvider);

    return Tasmee3AppScaffold(
      title: 'مواضع تحتاج مراجعة',
      body: markers.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text(error.toString())),
        data: (items) {
          if (items.isEmpty) {
            return const Tasmee3EmptyState(
              icon: Icons.check_circle_outline,
              title: 'لا توجد مواضع مراجعة',
              message: 'ستظهر هنا الآيات التي ظهرت فيها أخطاء أثناء التسميع.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final marker = items[index];

              return Container(
                decoration: BoxDecoration(
                  color: Tasmee3Colors.surface,
                  borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                  border: Border.all(color: Tasmee3Colors.border),
                ),
                child: ListTile(
                  leading: const Icon(
                    Icons.report_problem_outlined,
                    color: Tasmee3Colors.warning,
                  ),
                  title: Text('سورة ${marker.surah} - آية ${marker.ayah}'),
                  subtitle: Text(
                    'ملاحظات: ${marker.mistakesCount} - دقة تقريبية ${(marker.accuracy * 100).round()}%',
                  ),
                  trailing: const Icon(Icons.chevron_left),
                  onTap: () async {
                    var pageNumber = (await ref
                            .read(quranPageMetadataRepositoryProvider)
                            .findPageForAyah(
                              surah: marker.surah,
                              ayah: marker.ayah,
                            ))
                        ?.pageNumber;

                    if (pageNumber == null) {
                      final pages =
                          await ref.read(mushafPagesProvider.future);

                      for (final page in pages) {
                        for (final ayah in page.ayahs) {
                          if (ayah.ref.surah == marker.surah &&
                              ayah.ref.ayah == marker.ayah) {
                            pageNumber = page.pageNumber;
                            break;
                          }
                        }
                        if (pageNumber != null) break;
                      }
                    }

                    if (context.mounted) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MushafScreen(
                            initialPage: pageNumber ?? 1,
                            initialHighlightedSurah: marker.surah,
                            initialHighlightedAyah: marker.ayah,
                          ),
                        ),
                      );
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
