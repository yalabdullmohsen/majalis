// DEPRECATED: Do not use in navigation. Replaced by lib/features/mushaf and lib/features/tasmee3.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class JuzIndexScreen extends ConsumerWidget {
  const JuzIndexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    // تقريبي لبيانات mock: جزء 1 صفحة 1، جزء 30 صفحة 2
    final starts = {1: 1, 30: 2};
    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('فهرس الأجزاء')),
      body: ListView.builder(
        itemCount: 30,
        itemBuilder: (context, i) {
          final juz = i + 1;
          final page = starts[juz] ?? 1;
          return ListTile(
            title: Text(ArabicNumbers.juzLabel(juz)),
            subtitle: Text('انتقال تقريبي إلى صفحة $page'),
            onTap: () => context.go('/mushaf?page=$page'),
          );
        },
      ),
    );
  }
}
