import 'package:flutter/material.dart';

import '../../../tasmee3/domain/quran_ayah.dart';
import '../../domain/mushaf_font_family.dart';
import '../../domain/mushaf_page.dart';
import '../../domain/mushaf_reading_settings.dart';
import '../../domain/mushaf_reading_theme.dart';
import '../mushaf_reading_theme_colors.dart';

class MushafPageView extends StatelessWidget {
  final MushafPage page;
  final ValueChanged<QuranAyah> onAyahTap;
  final ValueChanged<QuranAyah> onAyahLongPress;
  final Set<String> selectedAyahKeys;
  final int? highlightedSurah;
  final int? highlightedAyah;
  final bool forceHighlight;
  final MushafReadingSettings readingSettings;

  const MushafPageView({
    super.key,
    required this.page,
    required this.onAyahTap,
    required this.onAyahLongPress,
    required this.readingSettings,
    this.selectedAyahKeys = const {},
    this.highlightedSurah,
    this.highlightedAyah,
    this.forceHighlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = MushafReadingThemeColors.fromTheme(readingSettings.theme);
    final isDark = readingSettings.theme.isDark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      padding: EdgeInsets.fromLTRB(
        readingSettings.pagePadding,
        16,
        readingSettings.pagePadding,
        12,
      ),
      decoration: BoxDecoration(
        color: colors.page,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          children: [
            if (readingSettings.showPageHeader) ...[
              _PageHeader(page: page, colors: colors),
              const SizedBox(height: 12),
            ],
            Expanded(
              child: SingleChildScrollView(
                // TODO: For production-grade mushaf layout, consider using RichText
                // with TapGestureRecognizer per ayah to improve line wrapping.
                child: Wrap(
                  textDirection: TextDirection.rtl,
                  alignment: WrapAlignment.center,
                  runSpacing: readingSettings.lineHeight * 6,
                  spacing: readingSettings.wordSpacing,
                  children: [
                    for (final ayah in page.ayahs)
                      _ayahSpan(ayah, colors),
                  ],
                ),
              ),
            ),
            if (readingSettings.showPageFooter) ...[
              const SizedBox(height: 10),
              _PageFooter(pageNumber: page.pageNumber, colors: colors),
            ],
          ],
        ),
      ),
    );
  }

  Widget _ayahSpan(QuranAyah ayah, MushafReadingThemeColors colors) {
    final tapped = ayah.ref.surah == highlightedSurah &&
        ayah.ref.ayah == highlightedAyah;
    final selected = selectedAyahKeys.contains(ayah.ref.key);
    final showTapHighlight = tapped &&
        !selected &&
        (forceHighlight || readingSettings.highlightTappedAyah);

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => onAyahTap(ayah),
      onLongPress: () => onAyahLongPress(ayah),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
        decoration: BoxDecoration(
          color: selected
              ? colors.highlight
              : showTapHighlight
                  ? colors.highlight
                  : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            text: '${ayah.textUthmani} ',
            style: TextStyle(
              fontSize: readingSettings.fontSize,
              height: readingSettings.lineHeight,
              color: colors.text,
              fontWeight: FontWeight.w500,
              fontFamily: readingSettings.fontFamily.fontFamily,
            ),
            children: [
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: _AyahMarker(
                  number: ayah.ref.ayah,
                  borderColor: colors.markerBorder,
                  textColor: colors.markerText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageHeader extends StatelessWidget {
  final MushafPage page;
  final MushafReadingThemeColors colors;

  const _PageHeader({
    required this.page,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          page.firstSurah == null ? '' : 'سورة ${page.firstSurah}',
          style: TextStyle(
            color: colors.secondaryText,
            fontWeight: FontWeight.bold,
          ),
        ),
        const Spacer(),
        Text(
          page.juz == 0
              ? ''
              : 'الجزء ${page.juz}${page.hizb == 0 ? '' : ' - حزب ${page.hizb}'}',
          style: TextStyle(
            color: colors.secondaryText,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _PageFooter extends StatelessWidget {
  final int pageNumber;
  final MushafReadingThemeColors colors;

  const _PageFooter({
    required this.pageNumber,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      '$pageNumber',
      style: TextStyle(
        color: colors.secondaryText,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _AyahMarker extends StatelessWidget {
  final int number;
  final Color borderColor;
  final Color textColor;

  const _AyahMarker({
    required this.number,
    required this.borderColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 25,
      height: 25,
      margin: const EdgeInsets.symmetric(horizontal: 3),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: borderColor),
      ),
      child: Text(
        '$number',
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
