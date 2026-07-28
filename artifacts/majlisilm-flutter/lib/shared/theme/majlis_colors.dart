import 'package:flutter/material.dart';

/// Brand tokens shared by UserApp + AdminPanel.
abstract final class MajlisColors {
  static const Color cream = Color(0xFFF5F5DC);
  static const Color darkBg = Color(0xFF1A1A1A);
  static const Color brown = Color(0xFF795548);
  static const Color sage = Color(0xFF5F7A66);
  static const Color gold = Color(0xFFD4AF37);
  static const Color rose = Color(0xFFA65D5D);
  static const Color adminSidebar = Color(0xFF1E1E2D);
  static const Color parchmentSoft = Color(0xFFFAF8F5);

  static Color verseSelected(bool dark) =>
      Colors.brown.withOpacity(dark ? 0.35 : 0.15);

  static Color versePlaying(bool dark) =>
      Colors.amber.withOpacity(dark ? 0.35 : 0.3);
}
