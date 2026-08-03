import 'package:flutter/material.dart';

import '../domain/mushaf_reading_theme.dart';

class MushafReadingThemeColors {
  final Color scaffold;
  final Color page;
  final Color text;
  final Color secondaryText;
  final Color border;
  final Color highlight;
  final Color markerBorder;
  final Color markerText;

  const MushafReadingThemeColors({
    required this.scaffold,
    required this.page,
    required this.text,
    required this.secondaryText,
    required this.border,
    required this.highlight,
    required this.markerBorder,
    required this.markerText,
  });

  static MushafReadingThemeColors fromTheme(MushafReadingTheme theme) {
    switch (theme) {
      case MushafReadingTheme.light:
        return const MushafReadingThemeColors(
          scaffold: Color(0xFFFAFAFA),
          page: Color(0xFFFFFFFF),
          text: Color(0xFF11100E),
          secondaryText: Color(0xFF77716B),
          border: Color(0xFFE3DDD3),
          highlight: Color(0x26A77A48),
          markerBorder: Color(0xFFA77A48),
          markerText: Color(0xFFA77A48),
        );
      case MushafReadingTheme.sepia:
        return const MushafReadingThemeColors(
          scaffold: Color(0xFFFBF7EF),
          page: Color(0xFFFFFCF3),
          text: Color(0xFF11100E),
          secondaryText: Color(0xFF9A8068),
          border: Color(0xFFE0C5A3),
          highlight: Color(0x2EA77A48),
          markerBorder: Color(0xFFA77A48),
          markerText: Color(0xFFA77A48),
        );
      case MushafReadingTheme.night:
        return const MushafReadingThemeColors(
          scaffold: Color(0xFF0F0C09),
          page: Color(0xFF15110D),
          text: Color(0xFFF4E9D8),
          secondaryText: Color(0xFFC7A873),
          border: Color(0xFF4D3B2A),
          highlight: Color(0x33D6B98A),
          markerBorder: Color(0xFFD6B98A),
          markerText: Color(0xFFD6B98A),
        );
      case MushafReadingTheme.pureBlack:
        return const MushafReadingThemeColors(
          scaffold: Color(0xFF000000),
          page: Color(0xFF000000),
          text: Color(0xFFEDE7DD),
          secondaryText: Color(0xFFB8A58F),
          border: Color(0xFF2C2C2C),
          highlight: Color(0x33A77A48),
          markerBorder: Color(0xFFD6B98A),
          markerText: Color(0xFFD6B98A),
        );
    }
  }
}
