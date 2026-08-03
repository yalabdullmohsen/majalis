import 'package:flutter/material.dart';

import '../../../tasmee3/domain/quran_ayah.dart';
import '../../domain/mushaf_page.dart';

class MushafPageView extends StatelessWidget {
  final MushafPage page;
  final ValueChanged<QuranAyah> onAyahTap;
  final int? highlightedSurah;
  final int? highlightedAyah;
  final bool nightMode;

  const MushafPageView({
    super.key,
    required this.page,
    required this.onAyahTap,
    this.highlightedSurah,
    this.highlightedAyah,
    this.nightMode = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = nightMode ? const Color(0xFF15110D) : const Color(0xFFFFFCF3);
    final border = nightMode ? const Color(0xFF4D3B2A) : const Color(0xFFE0C5A3);
    final text = nightMode ? const Color(0xFFF4E9D8) : const Color(0xFF11100E);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: nightMode ? 0.20 : 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          children: [
            _PageHeader(page: page, nightMode: nightMode),
            const SizedBox(height: 12),
            Expanded(
              child: SingleChildScrollView(
                child: Wrap(
                  textDirection: TextDirection.rtl,
                  alignment: WrapAlignment.center,
                  runSpacing: 10,
                  spacing: 4,
                  children: [
                    for (final ayah in page.ayahs) _ayahSpan(ayah, text),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            _PageFooter(pageNumber: page.pageNumber, nightMode: nightMode),
          ],
        ),
      ),
    );
  }

  Widget _ayahSpan(QuranAyah ayah, Color textColor) {
    final highlighted = ayah.ref.surah == highlightedSurah &&
        ayah.ref.ayah == highlightedAyah;

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => onAyahTap(ayah),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
        decoration: BoxDecoration(
          color: highlighted
              ? const Color(0xFFA77A48).withValues(alpha: 0.18)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            text: '${ayah.textUthmani} ',
            style: TextStyle(
              fontSize: 25,
              height: 1.9,
              color: textColor,
              fontWeight: FontWeight.w500,
              fontFamily: 'NotoNaskhArabic',
            ),
            children: [
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: _AyahMarker(number: ayah.ref.ayah),
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
  final bool nightMode;

  const _PageHeader({
    required this.page,
    required this.nightMode,
  });

  @override
  Widget build(BuildContext context) {
    final color = nightMode ? const Color(0xFFD6B98A) : const Color(0xFFA77A48);

    return Row(
      children: [
        Text(
          page.firstSurah == null ? '' : 'سورة ${page.firstSurah}',
          style: TextStyle(color: color, fontWeight: FontWeight.bold),
        ),
        const Spacer(),
        Text(
          page.juz == 0 ? 'تقسيم تقريبي' : 'الجزء ${page.juz}',
          style: TextStyle(color: color, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

class _PageFooter extends StatelessWidget {
  final int pageNumber;
  final bool nightMode;

  const _PageFooter({
    required this.pageNumber,
    required this.nightMode,
  });

  @override
  Widget build(BuildContext context) {
    final color = nightMode ? const Color(0xFFD6B98A) : const Color(0xFFA77A48);

    return Text(
      '$pageNumber',
      style: TextStyle(
        color: color,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _AyahMarker extends StatelessWidget {
  final int number;

  const _AyahMarker({
    required this.number,
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
        border: Border.all(color: const Color(0xFFA77A48)),
      ),
      child: Text(
        '$number',
        style: const TextStyle(
          color: Color(0xFFA77A48),
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
