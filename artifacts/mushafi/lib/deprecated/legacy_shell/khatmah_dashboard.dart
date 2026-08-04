// DEPRECATED: Do not use in navigation. Replaced by lib/features/mushaf and lib/features/tasmee3.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/widgets/app_card.dart';
import 'package:mushafi/features/khatmah/data/khatmah_repository.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

class KhatmahDashboard extends ConsumerStatefulWidget {
  const KhatmahDashboard({super.key});
  @override
  ConsumerState<KhatmahDashboard> createState() => _KhatmahDashboardState();
}

class _KhatmahDashboardState extends ConsumerState<KhatmahDashboard> {
  @override
  Widget build(BuildContext context) {
    final colors = MushafiColors.forMode(ref.watch(themeModeProvider));
    final plans = ref.watch(khatmahRepositoryProvider).list();
    final plan = plans.isEmpty ? null : plans.first;

    return Scaffold(
      backgroundColor: colors.scaffold,
      appBar: AppBar(title: const Text('الختمة')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await ref.read(khatmahRepositoryProvider).create();
          setState(() {});
        },
        label: const Text('ختمة جديدة'),
        icon: const Icon(Icons.add),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: plan == null
            ? const Center(child: Text('ابدأ ختمة جديدة'))
            : AppCard(
                colors: colors,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(plan.title, style: TextStyle(color: colors.ink, fontSize: 18)),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: 120,
                      height: 120,
                      child: CircularProgressIndicator(
                        value: plan.progress,
                        color: colors.ornament,
                        backgroundColor: colors.ornamentSoft.withValues(alpha: 0.3),
                        strokeWidth: 8,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('${(plan.progress * 100).toStringAsFixed(0)}%'),
                    Text('آخر موضع: صفحة ${plan.lastPage}'),
                    Text('سلسلة: ${plan.streak} يوم'),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.go('/mushaf?page=${plan.lastPage}'),
                      child: const Text('أكمل القراءة'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
