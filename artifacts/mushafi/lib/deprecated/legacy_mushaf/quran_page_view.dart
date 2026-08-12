// DEPRECATED: Do not use in navigation. Replaced by lib/features/mushaf and lib/features/tasmee3.

import 'package:flutter/material.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/ornaments/ayah_marker.dart';
import 'package:mushafi/design_system/ornaments/mushaf_painter.dart';
import 'package:mushafi/design_system/ornaments/page_footer.dart';
import 'package:mushafi/design_system/ornaments/surah_header.dart';
import 'package:mushafi/design_system/spacing.dart';
import 'package:mushafi/design_system/typography.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/quran_page.dart';
import 'package:mushafi/features/quran/domain/mushaf_layout_engine.dart';

class QuranPageView extends StatelessWidget {
  const QuranPageView({
    super.key,
    required this.page,
    required this.colors,
    required this.engine,
    required this.fontScale,
    required this.digitStyle,
    this.highlightedAyahKey,
    this.onAyahLongPress,
    this.onTap,
  });

  final QuranPage page;
  final MushafiColors colors;
  final MushafLayoutEngine engine;
  final double fontScale;
  final DigitStyle digitStyle;
  final String? highlightedAyahKey;
  final void Function(Ayah ayah)? onAyahLongPress;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final side = MediaQuery.sizeOf(context).width >= 400
        ? MushafiSpacing.pageSideMax
        : MushafiSpacing.pageSideMin;
    final fontSize = engine.fontSizeFor(engine.mode, fontScale);
    final height = engine.lineHeightFor(engine.mode);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: CustomPaint(
        painter: MushafPaperPainter(colors: colors),
        child: AspectRatio(
          aspectRatio: 9 / 16,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              side,
              MushafiSpacing.pageTop,
              side,
              MushafiSpacing.pageBottom,
            ),
            child: Column(
              children: [
                _PageHeader(
                  juz: page.juzNumber,
                  surahName: page.primarySurahName,
                  colors: colors,
                  digitStyle: digitStyle,
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Directionality(
                      textDirection: TextDirection.rtl,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final h in page.surahHeaders)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: SurahHeader(
                                surahName: h.surah.nameArabic,
                                colors: colors,
                                showBismillah: h.showBismillah,
                              ),
                            ),
                          Text.rich(
                            TextSpan(
                              children: [
                                for (final ayah in page.ayahs) ...[
                                  WidgetSpan(
                                    alignment: PlaceholderAlignment.middle,
                                    child: GestureDetector(
                                      onLongPress: () =>
                                          onAyahLongPress?.call(ayah),
                                      child: Container(
                                        margin: const EdgeInsets.symmetric(
                                          vertical: 2,
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 2,
                                        ),
                                        color: ayah.key == highlightedAyahKey
                                            ? colors.highlight
                                            : Colors.transparent,
                                        child: Text.rich(
                                          TextSpan(
                                            style: MushafiTypography.quranAyah(
                                              colors: colors,
                                              fontSize: fontSize,
                                              height: height,
                                            ),
                                            children: [
                                              TextSpan(text: ayah.textUthmani),
                                              const TextSpan(text: ' '),
                                              WidgetSpan(
                                                alignment:
                                                    PlaceholderAlignment.middle,
                                                child: AyahMarker(
                                                  number: ayah.ayahNumber,
                                                  colors: colors,
                                                  size: fontSize * 0.95,
                                                  digitStyle: digitStyle,
                                                ),
                                              ),
                                              const TextSpan(text: ' '),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            textAlign: TextAlign.justify,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                PageFooter(
                  pageNumber: page.pageNumber,
                  colors: colors,
                  hizbLabel: page.footerMarkers.halfHizbLabel,
                  digitStyle: digitStyle,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PageHeader extends StatelessWidget {
  const _PageHeader({
    required this.juz,
    required this.surahName,
    required this.colors,
    required this.digitStyle,
  });

  final int juz;
  final String surahName;
  final MushafiColors colors;
  final DigitStyle digitStyle;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Row(
        children: [
          // يمين الشاشة في RTL = بداية الصف: رقم الجزء
          Text(
            ArabicNumbers.juzLabel(juz, style: digitStyle),
            style: MushafiTypography.meta(colors),
          ),
          const Spacer(),
          // يسار: اسم السورة
          Text(
            surahName,
            style: MushafiTypography.meta(colors).copyWith(
              color: colors.ornament,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
