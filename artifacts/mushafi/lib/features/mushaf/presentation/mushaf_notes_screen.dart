import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../application/mushaf_providers.dart';

class MushafNotesScreen extends ConsumerWidget {
  const MushafNotesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);

    return Tasmee3AppScaffold(
      title: 'ملاحظاتي',
      body: state.notes.isEmpty
          ? const Tasmee3EmptyState(
              icon: Icons.note_alt_outlined,
              title: 'لا توجد ملاحظات',
              message: 'اضغط على آية ثم أضف ملاحظة خاصة بك.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(Tasmee3Spacing.lg),
              itemCount: state.notes.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final note = state.notes[index];

                return Container(
                  padding: const EdgeInsets.all(Tasmee3Spacing.md),
                  decoration: BoxDecoration(
                    color: Tasmee3Colors.surface,
                    borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                    border: Border.all(color: Tasmee3Colors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'سورة ${note.surah} - آية ${note.ayah}',
                        style: Tasmee3TextStyles.sectionTitle
                            .copyWith(fontSize: 16),
                      ),
                      const SizedBox(height: 6),
                      Text(note.text, style: Tasmee3TextStyles.body),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: () => controller.removeNote(note.id),
                          icon: const Icon(Icons.delete_outline),
                          label: const Text('حذف'),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
