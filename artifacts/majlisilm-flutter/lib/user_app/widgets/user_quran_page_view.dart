import 'package:flutter/material.dart';

import '../../shared/constants/majlis_constants.dart';
import '../../shared/models/shared_quran_verse.dart';
import '../../shared/theme/majlis_colors.dart';
import '../../shared/theme/majlis_theme.dart';

/// Edge-to-edge mushaf page canvas for the native mobile reader.
///
/// Stretches to [MediaQuery] width, keeps a Madinah-like aspect ratio via
/// [BoxFit.contain], and allows pinch-zoom through [InteractiveViewer].
/// Safety inset is intentionally tiny (2–4px) so text never clips device
/// rounded corners without recreating the old padded “card” look.
class UserQuranPageView extends StatelessWidget {
  const UserQuranPageView({
    super.key,
    required this.verses,
    required this.fontSize,
    required this.textColor,
    required this.backgroundColor,
    required this.isDark,
    this.selectedIndex,
    this.playingIndex,
    this.onVerseTap,
    this.safetyPadding = 3,
    this.designWidth = 360,
  });

  final List<SharedQuranVerse> verses;
  final double fontSize;
  final Color textColor;
  final Color backgroundColor;
  final bool isDark;
  final int? selectedIndex;
  final int? playingIndex;
  final ValueChanged<int>? onVerseTap;

  /// Ultra-fine edge inset (2–4px). Defaults to 3.
  final double safetyPadding;

  /// Logical design width of the page before [FittedBox] scales it.
  final double designWidth;

  static const double pageAspectRatio = 0.72;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final pad = safetyPadding.clamp(2.0, 4.0);
    final pageWidth = screenWidth - (pad * 2);

    return SizedBox(
      width: screenWidth,
      child: Padding(
        padding: EdgeInsets.all(pad),
        child: InteractiveViewer(
          // Pinch-zoom only — pan stays with NestedScrollView so
          // hide-on-scroll (scroll down/up) keeps working.
          panEnabled: false,
          scaleEnabled: true,
          minScale: 0.9,
          maxScale: 3.0,
          boundaryMargin: const EdgeInsets.all(24),
          clipBehavior: Clip.none,
          child: SizedBox(
            width: pageWidth,
            child: AspectRatio(
              aspectRatio: pageAspectRatio,
              child: FittedBox(
                fit: BoxFit.contain,
                alignment: Alignment.topCenter,
                child: SizedBox(
                  width: designWidth,
                  height: designWidth / pageAspectRatio,
                  child: _MushafPageCanvas(
                    verses: verses,
                    fontSize: fontSize,
                    textColor: textColor,
                    backgroundColor: backgroundColor,
                    isDark: isDark,
                    selectedIndex: selectedIndex,
                    playingIndex: playingIndex,
                    onVerseTap: onVerseTap,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MushafPageCanvas extends StatelessWidget {
  const _MushafPageCanvas({
    required this.verses,
    required this.fontSize,
    required this.textColor,
    required this.backgroundColor,
    required this.isDark,
    required this.selectedIndex,
    required this.playingIndex,
    required this.onVerseTap,
  });

  final List<SharedQuranVerse> verses;
  final double fontSize;
  final Color textColor;
  final Color backgroundColor;
  final bool isDark;
  final int? selectedIndex;
  final int? playingIndex;
  final ValueChanged<int>? onVerseTap;

  @override
  Widget build(BuildContext context) {
    final border = MajlisColors.brown.withOpacity(isDark ? 0.45 : 0.55);
    final surahName = verses.isNotEmpty ? verses.first.surahNameAr : 'القرآن';

    return DecoratedBox(
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border.all(color: border, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.35 : 0.08),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 6, 8, 4),
            child: Row(
              children: [
                Text(
                  'سورة $surahName',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: textColor.withOpacity(0.85),
                  ),
                ),
                const Spacer(),
                Text(
                  'المصحف',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: textColor.withOpacity(0.55),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 0.6, color: border.withOpacity(0.45)),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(6, 6, 6, 4),
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: verses.length,
                  itemBuilder: (context, index) {
                    final verse = verses[index];
                    Color? bg;
                    if (playingIndex == index) {
                      bg = MajlisColors.versePlaying(isDark);
                    } else if (selectedIndex == index) {
                      bg = MajlisColors.verseSelected(isDark);
                    }

                    return Material(
                      color: bg ?? Colors.transparent,
                      child: InkWell(
                        onTap: onVerseTap == null
                            ? null
                            : () => onVerseTap!(index),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            vertical: 3,
                            horizontal: 2,
                          ),
                          child: Text.rich(
                            TextSpan(
                              style: MajlisTheme.uthmaniStyle(
                                fontSize: fontSize,
                                color: textColor,
                                height: MajlisConstants.lineHeight,
                              ),
                              children: [
                                TextSpan(text: verse.textUthmani),
                                TextSpan(
                                  text: ' ﴿${_eastern(verse.ayah)}﴾',
                                  style: TextStyle(
                                    fontSize: fontSize * 0.72,
                                    fontWeight: FontWeight.w700,
                                    color: MajlisColors.brown,
                                    height: MajlisConstants.lineHeight,
                                  ),
                                ),
                              ],
                            ),
                            textAlign: TextAlign.justify,
                            textDirection: TextDirection.rtl,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static String _eastern(int n) {
    const western = '0123456789';
    const eastern = '٠١٢٣٤٥٦٧٨٩';
    return n
        .toString()
        .split('')
        .map((c) {
          final i = western.indexOf(c);
          return i >= 0 ? eastern[i] : c;
        })
        .join();
  }
}
