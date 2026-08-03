import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';
import '../domain/tafsir_source.dart';

class MushafTafsirScreen extends ConsumerWidget {
  final QuranAyah ayah;
  final TafsirSource source;

  const MushafTafsirScreen({
    super.key,
    required this.ayah,
    required this.source,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final future = ref.watch(tafsirRepositoryProvider).getTafsir(
          source: source,
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        );

    return Tasmee3AppScaffold(
      title: source.nameArabic,
      body: FutureBuilder(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Tasmee3LoadingState(message: 'جاري تحميل التفسير...');
          }

          if (snapshot.hasError) {
            return Tasmee3ErrorState(message: snapshot.error.toString());
          }

          final tafsir = snapshot.data;

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
                child: Text(
                  ayah.textUthmani,
                  textAlign: TextAlign.center,
                  style: Tasmee3TextStyles.arabicAyah,
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              Container(
                padding: const EdgeInsets.all(Tasmee3Spacing.lg),
                decoration: BoxDecoration(
                  color: Tasmee3Colors.surface,
                  borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
                  border: Border.all(color: Tasmee3Colors.border),
                ),
                child: Text(
                  tafsir?.text.trim().isNotEmpty == true
                      ? tafsir!.text
                      : 'لا يوجد تفسير متاح لهذه الآية في المصدر الحالي. أضف ملف تفسير مرخصا داخل assets/tafsir.',
                  style: Tasmee3TextStyles.body,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
