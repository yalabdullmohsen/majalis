import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../shared/models/shared_quran_verse.dart';
import '../../shared/theme/majlis_colors.dart';
import '../controllers/user_quran_app_controller.dart';
import '../services/user_audio_player_service.dart';
import 'user_tafsir_modal.dart';

/// Verse actions sheet: play/pause, tafsir, copy.
class UserVerseBottomSheet extends StatelessWidget {
  const UserVerseBottomSheet({
    super.key,
    required this.verse,
    required this.index,
  });

  final SharedQuranVerse verse;
  final int index;

  static Future<void> show(
    BuildContext context, {
    required SharedQuranVerse verse,
    required int index,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => UserVerseBottomSheet(verse: verse, index: index),
    );
  }

  @override
  Widget build(BuildContext context) {
    final quran = context.watch<UserQuranAppController>();
    final audio = context.read<UserAudioPlayerService>();
    final playingThis =
        quran.isPlayingAudio && quran.currentPlayingVerse == index;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              verse.textUthmani,
              textAlign: TextAlign.center,
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontSize: quran.fontSize * 0.85,
                height: 1.9,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(verse.verseRef, style: TextStyle(color: Colors.grey.shade600)),
            const Divider(height: 28),
            ListTile(
              leading: Icon(
                playingThis ? Icons.pause_circle_filled : Icons.play_circle_filled,
                color: MajlisColors.brown,
                size: 32,
              ),
              title: Text(playingThis ? 'إيقاف التلاوة' : 'تشغيل التلاوة'),
              onTap: () async {
                final nowPlaying = await audio.toggleAyah(verse.surah, verse.ayah);
                if (nowPlaying) {
                  quran.toggleAudio(index);
                } else {
                  quran.stopAudio();
                }
                if (context.mounted) Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.menu_book_rounded, color: MajlisColors.brown),
              title: const Text('عرض التفسير'),
              onTap: () {
                Navigator.pop(context);
                UserTafsirModal.show(
                  context,
                  verseText: verse.textUthmani,
                  tafsirText: verse.tafsir.isEmpty
                      ? 'لا يتوفر تفسير لهذه الآية في العينة.'
                      : verse.tafsir,
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy_rounded, color: MajlisColors.brown),
              title: const Text('نسخ نص الآية'),
              onTap: () async {
                await Clipboard.setData(ClipboardData(text: verse.textUthmani));
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم نسخ الآية')),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
