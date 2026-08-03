import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';
import 'mushaf_screen.dart';

class MushafBookmarksScreen extends ConsumerWidget {
  const MushafBookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);

    return Tasmee3AppScaffold(
      title: 'علامات المصحف',
      body: state.bookmarks.isEmpty
          ? const Tasmee3EmptyState(
              icon: Icons.bookmark_border,
              title: 'لا توجد علامات',
              message: 'اضغط على آية ثم أضف علامة للرجوع إليها لاحقا.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(Tasmee3Spacing.lg),
              itemCount: state.bookmarks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = state.bookmarks[index];
                final color = _parseColor(item.colorHex);

                return Container(
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: ListTile(
                    leading: Icon(Icons.bookmark, color: color),
                    title: Text('سورة ${item.surah} - آية ${item.ayah}'),
                    subtitle: Text('صفحة ${item.pageNumber}'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MushafScreen(
                            initialPage:
                                item.pageNumber == 0 ? 1 : item.pageNumber,
                          ),
                        ),
                      );
                    },
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () {
                        controller.removeBookmark(item.id);
                      },
                    ),
                  ),
                );
              },
            ),
    );
  }

  Color _parseColor(String hex) {
    final cleaned = hex.replaceFirst('#', '');
    if (cleaned.length != 6) return Tasmee3Colors.primary;
    return Color(int.parse('FF$cleaned', radix: 16));
  }
}
