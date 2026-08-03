import 'package:flutter/material.dart';
import 'package:mushafi/core/theme/app_theme.dart';

class MushafiColors {
  const MushafiColors({
    required this.paper,
    required this.scaffold,
    required this.ink,
    required this.secondaryText,
    required this.ornament,
    required this.ornamentSoft,
    required this.highlight,
    required this.errorWord,
    required this.missingWord,
    required this.lowConfidence,
  });

  final Color paper;
  final Color scaffold;
  final Color ink;
  final Color secondaryText;
  final Color ornament;
  final Color ornamentSoft;
  final Color highlight;
  final Color errorWord;
  final Color missingWord;
  final Color lowConfidence;

  static const light = MushafiColors(
    paper: Color(0xFFFBF7EF),
    scaffold: Color(0xFFFAF6ED),
    ink: Color(0xFF11100E),
    secondaryText: Color(0xFF9A8068),
    ornament: Color(0xFFA77A48),
    ornamentSoft: Color(0xFFD4B896),
    highlight: Color(0x33A77A48),
    errorWord: Color(0xFFC62828),
    missingWord: Color(0xFFEF6C00),
    lowConfidence: Color(0xFF1565C0),
  );

  static const sepia = MushafiColors(
    paper: Color(0xFFF3E6D0),
    scaffold: Color(0xFFEFE0C6),
    ink: Color(0xFF2A2118),
    secondaryText: Color(0xFF8A7058),
    ornament: Color(0xFF9A6B3C),
    ornamentSoft: Color(0xFFC9A878),
    highlight: Color(0x449A6B3C),
    errorWord: Color(0xFFC62828),
    missingWord: Color(0xFFEF6C00),
    lowConfidence: Color(0xFF1565C0),
  );

  static const dark = MushafiColors(
    paper: Color(0xFF1A1814),
    scaffold: Color(0xFF12110E),
    ink: Color(0xFFF3EDE3),
    secondaryText: Color(0xFFB8A38E),
    ornament: Color(0xFFC9A06A),
    ornamentSoft: Color(0xFF6E5638),
    highlight: Color(0x44C9A06A),
    errorWord: Color(0xFFEF9A9A),
    missingWord: Color(0xFFFFB74D),
    lowConfidence: Color(0xFF90CAF9),
  );

  static MushafiColors forMode(MushafiThemeMode mode) => switch (mode) {
        MushafiThemeMode.light => light,
        MushafiThemeMode.dark => dark,
        MushafiThemeMode.sepia => sepia,
      };
}
