import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class SurahIndexScreen extends ConsumerWidget {
  const SurahIndexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final ready = ref.watch(quranReadyProvider);
    final repo = ref.watch(quranRepositoryProvider);
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('فهرس السور')),
      body: ready.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (_) => ListView.builder(
          itemCount: repo.surahs.length,
          itemBuilder: (context, i) {
            final s = repo.surahs[i];
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: colors.ornamentSoft.withValues(alpha: 0.3),
                child: Text('${s.id}', style: TextStyle(color: colors.ornament)),
              ),
              title: Text(s.nameArabic, textDirection: TextDirection.rtl),
              subtitle: Text('${s.ayahCount} آية — صفحة ${s.startPage}'),
              onTap: () => context.go('/mushaf?page=${s.startPage}'),
            );
          },
        ),
      ),
    );
  }
}
