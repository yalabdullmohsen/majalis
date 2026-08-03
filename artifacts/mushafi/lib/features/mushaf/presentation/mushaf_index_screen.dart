import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/data/surah_catalog.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';

class MushafIndexScreen extends ConsumerWidget {
  const MushafIndexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Tasmee3AppScaffold(
      title: 'فهرس المصحف',
      body: ListView.separated(
        padding: const EdgeInsets.all(Tasmee3Spacing.lg),
        itemCount: SurahCatalog.all.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final surah = SurahCatalog.all[index];

          return Container(
            decoration: BoxDecoration(
              color: Tasmee3Colors.surface,
              borderRadius: BorderRadius.circular(Tasmee3Radius.md),
              border: Border.all(color: Tasmee3Colors.border),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor:
                    Tasmee3Colors.primary.withValues(alpha: 0.12),
                child: Text(
                  '${surah.id}',
                  style: const TextStyle(
                    color: Tasmee3Colors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              title: Text(
                surah.nameArabic,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text('${surah.ayahCount} آية'),
              trailing: const Icon(Icons.chevron_left),
              onTap: () {
                // Approximate jump until licensed page metadata is available.
                final page = ((surah.id - 1) * 604 / 114).floor() + 1;
                Navigator.pop(context, page);
              },
            ),
          );
        },
      ),
    );
  }
}
