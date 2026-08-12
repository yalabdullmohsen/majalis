import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../tasmee3/domain/quran_ayah.dart';
import '../../../tasmee3/domain/tasmee3_launch_config.dart';
import '../../../tasmee3/domain/tasmee3_launch_source.dart';
import '../../../tasmee3/presentation/tasmee3_screen.dart';
import '../../application/mushaf_providers.dart';
import '../../data/tafsir_catalog.dart';
import '../../domain/mushaf_tasmee3_last_range.dart';
import '../ayah_share_preview_screen.dart';
import '../mushaf_ayah_review_screen.dart';
import '../mushaf_design_tokens.dart';
import '../mushaf_tafsir_screen.dart';

class MushafAyahActionsSheet extends ConsumerWidget {
  final QuranAyah ayah;
  final bool nightMode;
  final int pageNumber;

  const MushafAyahActionsSheet({
    super.key,
    required this.ayah,
    required this.nightMode,
    required this.pageNumber,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(mushafControllerProvider.notifier);
    final state = ref.watch(mushafControllerProvider);
    final isFavorite =
        state.favorites.any((item) => item.key == ayah.ref.key);
    final textColor =
        nightMode ? MushafColors.nightText : MushafColors.text;
    final surfaceColor =
        nightMode ? MushafColors.nightSurface : MushafColors.paper;
    final reviewMarkersAsync = ref.watch(mushafReviewMarkersProvider);
    final ayahMarkers = reviewMarkersAsync.maybeWhen(
      data: (items) => items
          .where(
            (item) =>
                item.surah == ayah.ref.surah && item.ayah == ayah.ref.ayah,
          )
          .toList(),
      orElse: () => const [],
    );

    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(MushafSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(MushafSpacing.lg),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(MushafRadius.lg),
                  border: Border.all(color: MushafColors.border),
                ),
                child: Column(
                  children: [
                    Text(
                      'سورة ${ayah.ref.surah} - آية ${ayah.ref.ayah}',
                      style: MushafTextStyles.sectionTitle.copyWith(
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: MushafSpacing.sm),
                    Text(
                      ayah.textUthmani,
                      textAlign: TextAlign.center,
                      style: MushafTextStyles.ayah.copyWith(
                        color: textColor,
                        fontSize: 22,
                      ),
                    ),
                  ],
                ),
              ),
              const _ActionSectionLabel('قراءة وفهم'),
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
                onTap: () async {
                  final audio =
                      ref.read(mushafAudioControllerProvider.notifier);

                  Navigator.pop(context);

                  await audio.playAyah(ayah);
                },
              ),
              const _ActionSectionLabel('حفظ ومراجعة'),
              _ActionTile(
                icon: Icons.mic_none_outlined,
                title: 'سمّعني هذه الآية',
                onTap: () async {
                  final mapper =
                      ref.read(mushafToTasmee3TargetMapperProvider);
                  final target = mapper.fromAyahs([ayah]);

                  await ref
                      .read(mushafLocalRepositoryProvider)
                      .saveLastTasmee3Range(
                        MushafTasmee3LastRange(
                          fromSurah: ayah.ref.surah,
                          fromAyah: ayah.ref.ayah,
                          toSurah: ayah.ref.surah,
                          toAyah: ayah.ref.ayah,
                          updatedAt: DateTime.now(),
                        ),
                      );

                  if (!context.mounted) return;

                  Navigator.pop(context);

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => Tasmee3Screen(
                        launchConfig: Tasmee3LaunchConfig(
                          initialTarget: target,
                          source: Tasmee3LaunchSource.mushaf,
                          showSourceBanner: true,
                          returnToMushafAfterCompletion: true,
                        ),
                      ),
                    ),
                  );
                },
              ),
              if (ayahMarkers.isNotEmpty)
                _ActionTile(
                  icon: Icons.report_problem_outlined,
                  title: 'مواضع تحتاج مراجعة',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MushafAyahReviewScreen(
                          surah: ayah.ref.surah,
                          ayah: ayah.ref.ayah,
                        ),
                      ),
                    );
                  },
                ),
              _ActionTile(
                icon: Icons.download_outlined,
                title: 'تنزيل صوت الآية',
                onTap: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  final settingsRepository =
                      ref.read(mushafAudioSettingsRepositoryProvider);
                  final settings = await settingsRepository.load();
                  final downloader = ref
                      .read(mushafAudioDownloadControllerProvider.notifier);

                  if (context.mounted) {
                    Navigator.pop(context);
                  }

                  try {
                    await downloader.downloadAyahs(
                      reciterId: settings.reciterId,
                      ayahs: [ayah],
                    );

                    ref.invalidate(mushafAudioDownloadsProvider);

                    messenger.showSnackBar(
                      const SnackBar(content: Text('تم تنزيل صوت الآية.')),
                    );
                  } catch (e) {
                    final message =
                        e is StateError ? e.message : e.toString();
                    messenger.showSnackBar(
                      SnackBar(content: Text('تعذر التنزيل: $message')),
                    );
                  }
                },
              ),
              const _ActionSectionLabel('حفظ شخصي'),
              _ActionTile(
                icon: isFavorite ? Icons.star : Icons.star_border,
                title: isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة',
                onTap: () async {
                  await controller.toggleFavorite(ayah);

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          isFavorite
                              ? 'تمت الإزالة من المفضلة.'
                              : 'تمت الإضافة للمفضلة.',
                        ),
                      ),
                    );
                  }
                },
              ),
              _ActionTile(
                icon: Icons.note_add_outlined,
                title: 'إضافة ملاحظة',
                onTap: () {
                  Navigator.pop(context);
                  _showNoteDialog(context, ref);
                },
              ),
              _ActionTile(
                icon: Icons.bookmark_add_outlined,
                title: 'إضافة علامة صفحة',
                onTap: () async {
                  await controller.addBookmark(
                    pageNumber: pageNumber,
                    ayah: ayah,
                    colorHex: '#A77A48',
                  );

                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تمت إضافة علامة.')),
                    );
                  }
                },
              ),
              const _ActionSectionLabel('مشاركة'),
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
                icon: Icons.image_outlined,
                title: 'مشاركة كصورة',
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AyahSharePreviewScreen(
                        ayahs: [ayah],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNoteDialog(BuildContext context, WidgetRef ref) {
    final controller = ref.read(mushafControllerProvider.notifier);
    final state = ref.read(mushafControllerProvider);

    final existing = state.notes.where((note) => note.key == ayah.ref.key);
    final textController = TextEditingController(
      text: existing.isEmpty ? '' : existing.first.text,
    );

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('ملاحظة على الآية'),
            content: TextField(
              controller: textController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'اكتب ملاحظتك هنا...',
                border: OutlineInputBorder(),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final text = textController.text.trim();
                  if (text.isEmpty) {
                    Navigator.pop(dialogContext);
                    return;
                  }

                  await controller.saveNote(
                    ayah: ayah,
                    text: text,
                  );

                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }

                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم حفظ الملاحظة.')),
                    );
                  }
                },
                child: const Text('حفظ'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ActionSectionLabel extends StatelessWidget {
  final String label;

  const _ActionSectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 4),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          label,
          style: const TextStyle(
            color: Color(0xFFA77A48),
            fontWeight: FontWeight.bold,
            fontSize: 13,
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
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: MushafColors.primary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_left),
      onTap: onTap,
    );
  }
}
