import 'package:flutter/material.dart';

import '../../../tasmee3/domain/quran_ayah.dart';
import '../../application/ayah_share_text_builder.dart';
import '../../domain/ayah_card_settings.dart';
import '../../domain/ayah_card_theme.dart';

class AyahShareCard extends StatelessWidget {
  final List<QuranAyah> ayahs;
  final AyahCardSettings settings;
  final AyahShareTextBuilder textBuilder;

  const AyahShareCard({
    super.key,
    required this.ayahs,
    required this.settings,
    required this.textBuilder,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _colors(settings.theme);
    final reference = textBuilder.buildReference(ayahs);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        width: 1080,
        padding: const EdgeInsets.all(64),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              colors.backgroundTop,
              colors.backgroundBottom,
            ],
          ),
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 58, vertical: 62),
          decoration: BoxDecoration(
            color: colors.card.withValues(alpha: 0.94),
            borderRadius: BorderRadius.circular(42),
            border: Border.all(
              color: colors.border.withValues(alpha: 0.55),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.10),
                blurRadius: 34,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (settings.showReference && reference.isNotEmpty) ...[
                Text(
                  reference,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: colors.accent,
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 34),
              ],
              Text(
                ayahs.map((ayah) => ayah.textUthmani).join('  '),
                textAlign:
                    settings.centerText ? TextAlign.center : TextAlign.right,
                style: TextStyle(
                  color: colors.text,
                  fontSize: settings.fontSize * 2.0,
                  height: 2.0,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'NotoNaskhArabic',
                ),
              ),
              if (settings.showDivider) ...[
                const SizedBox(height: 44),
                Container(
                  height: 2,
                  width: 240,
                  decoration: BoxDecoration(
                    color: colors.border.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ],
              if (settings.showBrand) ...[
                const SizedBox(height: 30),
                Text(
                  'مصحفي',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: colors.secondaryText,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  _AyahCardColors _colors(AyahCardThemeType theme) {
    switch (theme) {
      case AyahCardThemeType.parchment:
        return const _AyahCardColors(
          backgroundTop: Color(0xFFFBF1DD),
          backgroundBottom: Color(0xFFE4C99E),
          card: Color(0xFFFFFCF3),
          text: Color(0xFF15110D),
          secondaryText: Color(0xFF8A6A43),
          accent: Color(0xFFA77A48),
          border: Color(0xFFD6B98A),
        );
      case AyahCardThemeType.night:
        return const _AyahCardColors(
          backgroundTop: Color(0xFF0E0B08),
          backgroundBottom: Color(0xFF2A1F17),
          card: Color(0xFF16110D),
          text: Color(0xFFF7EBD8),
          secondaryText: Color(0xFFC7A873),
          accent: Color(0xFFD6B98A),
          border: Color(0xFF6D543B),
        );
      case AyahCardThemeType.sand:
        return const _AyahCardColors(
          backgroundTop: Color(0xFFEED9B5),
          backgroundBottom: Color(0xFFC69C6D),
          card: Color(0xFFFFF7E8),
          text: Color(0xFF2A1D12),
          secondaryText: Color(0xFF91704B),
          accent: Color(0xFF9E6F3B),
          border: Color(0xFFCDAF83),
        );
      case AyahCardThemeType.emerald:
        return const _AyahCardColors(
          backgroundTop: Color(0xFF0F3D33),
          backgroundBottom: Color(0xFF08241F),
          card: Color(0xFFF5FFF9),
          text: Color(0xFF0A211C),
          secondaryText: Color(0xFF49776C),
          accent: Color(0xFF0F6B56),
          border: Color(0xFF9CC7B7),
        );
      case AyahCardThemeType.minimal:
        return const _AyahCardColors(
          backgroundTop: Color(0xFFFFFFFF),
          backgroundBottom: Color(0xFFF4F1EC),
          card: Color(0xFFFFFFFF),
          text: Color(0xFF11100E),
          secondaryText: Color(0xFF77716B),
          accent: Color(0xFFA77A48),
          border: Color(0xFFE3DDD3),
        );
    }
  }
}

class _AyahCardColors {
  final Color backgroundTop;
  final Color backgroundBottom;
  final Color card;
  final Color text;
  final Color secondaryText;
  final Color accent;
  final Color border;

  const _AyahCardColors({
    required this.backgroundTop,
    required this.backgroundBottom,
    required this.card,
    required this.text,
    required this.secondaryText,
    required this.accent,
    required this.border,
  });
}
