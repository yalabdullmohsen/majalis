import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';

class MushafFavoritesScreen extends ConsumerWidget {
  const MushafFavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mushafControllerProvider);

    return Tasmee3AppScaffold(
      title: 'المفضلة',
      body: state.favorites.isEmpty
          ? const Tasmee3EmptyState(
              icon: Icons.star_border,
              title: 'لا توجد آيات مفضلة',
              message: 'اضغط على آية من المصحف ثم أضفها للمفضلة.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(Tasmee3Spacing.lg),
              itemCount: state.favorites.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = state.favorites[index];

                return Container(
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: ListTile(
                    leading:
                        const Icon(Icons.star, color: Tasmee3Colors.primary),
                    title: Text('سورة ${item.surah} - آية ${item.ayah}'),
                    subtitle: Text(item.createdAt.toLocal().toString()),
                  ),
                );
              },
            ),
    );
  }
}
