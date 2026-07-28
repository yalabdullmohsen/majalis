import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../shared/constants/majlis_constants.dart';
import '../../shared/models/shared_quran_verse.dart';
import '../../shared/theme/majlis_colors.dart';
import '../../shared/theme/majlis_theme.dart';
import '../controllers/user_quran_app_controller.dart';
import '../data/user_quran_repository.dart';
import '../widgets/user_verse_bottom_sheet.dart';

/// Immersive Quran reader — PageView of verse ListViews, tap to select + sheet.
class UserQuranReaderView extends StatelessWidget {
  const UserQuranReaderView({super.key, this.surah = 1});

  final int surah;

  @override
  Widget build(BuildContext context) {
    final quran = context.watch<UserQuranAppController>();
    final verses = UserQuranRepository.getVerses(surah: surah);

    return ColoredBox(
      color: quran.backgroundColor,
      child: PageView.builder(
        itemCount: 1,
        itemBuilder: (context, page) {
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: verses.length,
            itemBuilder: (context, index) {
              final verse = verses[index];
              return _VerseTile(
                verse: verse,
                index: index,
                fontSize: quran.fontSize,
                textColor: quran.textColor,
                selected: quran.selectedVerseIndex == index,
                playing: quran.isPlayingAudio &&
                    quran.currentPlayingVerse == index,
                isDark: quran.isDarkMode,
                onTap: () {
                  quran.selectVerse(index);
                  UserVerseBottomSheet.show(
                    context,
                    verse: verse,
                    index: index,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

class _VerseTile extends StatelessWidget {
  const _VerseTile({
    required this.verse,
    required this.index,
    required this.fontSize,
    required this.textColor,
    required this.selected,
    required this.playing,
    required this.isDark,
    required this.onTap,
  });

  final SharedQuranVerse verse;
  final int index;
  final double fontSize;
  final Color textColor;
  final bool selected;
  final bool playing;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    Color? bg;
    if (playing) {
      bg = MajlisColors.versePlaying(isDark);
    } else if (selected) {
      bg = MajlisColors.verseSelected(isDark);
    }

    return Material(
      color: bg ?? Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: MajlisColors.brown.withOpacity(0.15),
                child: Text(
                  '${verse.ayah}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: MajlisColors.brown,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  verse.textUthmani,
                  textAlign: TextAlign.justify,
                  textDirection: TextDirection.rtl,
                  style: MajlisTheme.uthmaniStyle(
                    fontSize: fontSize,
                    color: textColor,
                    height: MajlisConstants.lineHeight,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
