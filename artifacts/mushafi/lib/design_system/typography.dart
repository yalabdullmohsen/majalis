import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';

class MushafiTypography {
  MushafiTypography._();

  static const String quranFamily = 'MushafiQuran';
  static const String uiFamily = 'MushafiUi';

  static TextTheme textTheme(MushafiColors c) {
    return TextTheme(
      bodyLarge: TextStyle(
        fontFamily: uiFamily,
        fontSize: 16,
        height: 1.6,
        color: c.ink,
      ),
      bodyMedium: TextStyle(
        fontFamily: uiFamily,
        fontSize: 14,
        height: 1.5,
        color: c.ink,
      ),
      titleLarge: uiTitle(c),
      labelLarge: TextStyle(
        fontFamily: uiFamily,
        fontSize: 13,
        color: c.secondaryText,
      ),
    );
  }

  static TextStyle uiTitle(MushafiColors c) => TextStyle(
        fontFamily: uiFamily,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: c.ink,
      );

  static TextStyle quranAyah({
    required MushafiColors colors,
    double fontSize = 28,
    double height = 2.15,
  }) =>
      TextStyle(
        fontFamily: quranFamily,
        fontSize: fontSize,
        height: height,
        color: colors.ink,
      );

  static TextStyle bismillah(MushafiColors colors) => TextStyle(
        fontFamily: quranFamily,
        fontSize: 26,
        height: 2,
        color: colors.ink,
        fontWeight: FontWeight.w500,
      );

  static TextStyle surahName(MushafiColors colors) => TextStyle(
        fontFamily: uiFamily,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: colors.ornament,
      );

  static TextStyle meta(MushafiColors colors) => TextStyle(
        fontFamily: uiFamily,
        fontSize: 13,
        color: colors.secondaryText,
      );
}
