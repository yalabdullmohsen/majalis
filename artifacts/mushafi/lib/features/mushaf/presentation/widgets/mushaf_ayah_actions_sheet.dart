import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../tasmee3/domain/quran_ayah.dart';
import '../../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../application/mushaf_providers.dart';
import '../../data/tafsir_catalog.dart';
import '../../domain/mushaf_favorite_ayah.dart';
import '../../domain/mushaf_note.dart';
import '../mushaf_tafsir_screen.dart';

class MushafAyahActionsSheet extends ConsumerWidget {
  final QuranAyah ayah;
  final bool nightMode;

  const MushafAyahActionsSheet({
    super.key,
    required this.ayah,
    required this.nightMode,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textColor = nightMode ? Colors.white : Tasmee3Colors.text;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Tasmee3Spacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'سورة ${ayah.ref.surah} - آية ${ayah.ref.ayah}',
                style: Tasmee3TextStyles.sectionTitle.copyWith(
                  color: textColor,
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.md),
              Text(
                ayah.textUthmani,
                textAlign: TextAlign.center,
                style: Tasmee3TextStyles.arabicAyah.copyWith(
                  color: textColor,
                ),
              ),
              const SizedBox(height: Tasmee3Spacing.lg),
              _ActionTile(
                icon: Icons.menu_book_outlined,
                title: 'التفسير',
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => MushafTafsirScreen(
                        ayah: ayah,
                        source: TafsirCatalog.defaultSource(),
                      ),
                    ),
                  );
                },
              ),
              _ActionTile(
                icon: Icons.play_arrow,
                title: 'استماع للآية',
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'الاستماع يحتاج مصدر صوت مرخص يتم ضبطه في إعدادات القراء.',
                      ),
                    ),
                  );
                },
              ),
              _ActionTile(
                icon: Icons.copy,
                title: 'نسخ الآية',
                onTap: () async {
                  await Clipboard.setData(
                    ClipboardData(text: ayah.textUthmani),
                  );

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم نسخ الآية.')),
                    );
                  }
                },
              ),
              _ActionTile(
                icon: Icons.star_border,
                title: 'إضافة للمفضلة',
                onTap: () async {
                  final repository = ref.read(mushafLocalRepositoryProvider);
                  final favorite = MushafFavoriteAyah(
                    id: DateTime.now().microsecondsSinceEpoch.toString(),
                    surah: ayah.ref.surah,
                    ayah: ayah.ref.ayah,
                    createdAt: DateTime.now(),
                  );

                  await repository.toggleFavorite(favorite);
                  ref.invalidate(mushafFavoritesProvider);

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'تم تحديث المفضلة للآية ${favorite.surah}:${favorite.ayah}.',
                        ),
                      ),
                    );
                  }
                },
              ),
              _ActionTile(
                icon: Icons.note_add_outlined,
                title: 'إضافة ملاحظة',
                onTap: () async {
                  final controller = TextEditingController();
                  final noteText = await showDialog<String>(
                    context: context,
                    builder: (dialogContext) {
                      return Directionality(
                        textDirection: TextDirection.rtl,
                        child: AlertDialog(
                          title: const Text('ملاحظة على الآية'),
                          content: TextField(
                            controller: controller,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              hintText: 'اكتب ملاحظتك...',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(dialogContext),
                              child: const Text('إلغاء'),
                            ),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.pop(
                                  dialogContext,
                                  controller.text.trim(),
                                );
                              },
                              child: const Text('حفظ'),
                            ),
                          ],
                        ),
                      );
                    },
                  );

                  if (!context.mounted) return;
                  Navigator.pop(context);

                  if (noteText == null || noteText.isEmpty) return;

                  final now = DateTime.now();
                  await ref.read(mushafLocalRepositoryProvider).saveNote(
                        MushafNote(
                          id: now.microsecondsSinceEpoch.toString(),
                          surah: ayah.ref.surah,
                          ayah: ayah.ref.ayah,
                          text: noteText,
                          createdAt: now,
                          updatedAt: now,
                        ),
                      );

                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم حفظ الملاحظة.')),
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Tasmee3Colors.primary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_left),
      onTap: onTap,
    );
  }
}
