import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'majlis_colors.dart';

abstract final class MajlisTheme {
  static const String uthmaniFamilyFallback = 'UthmaniFont';

  static TextStyle uthmaniStyle({
    required double fontSize,
    required Color color,
    double height = 2.1,
  }) {
    try {
      return GoogleFonts.amiri(
        fontSize: fontSize,
        color: color,
        height: height,
        fontWeight: FontWeight.w700,
      );
    } catch (_) {
      return TextStyle(
        fontFamily: uthmaniFamilyFallback,
        fontSize: fontSize,
        color: color,
        height: height,
        fontWeight: FontWeight.w700,
      );
    }
  }

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: MajlisColors.cream,
      colorScheme: ColorScheme.fromSeed(
        seedColor: MajlisColors.brown,
        brightness: Brightness.light,
        surface: MajlisColors.cream,
      ),
    );
    return base.copyWith(
      textTheme: GoogleFonts.ibmPlexSansArabicTextTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: MajlisColors.cream,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
    );
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: MajlisColors.darkBg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: MajlisColors.brown,
        brightness: Brightness.dark,
        surface: MajlisColors.darkBg,
      ),
    );
    return base.copyWith(
      textTheme: GoogleFonts.ibmPlexSansArabicTextTheme(base.textTheme).apply(
        bodyColor: Colors.white70,
        displayColor: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: MajlisColors.darkBg,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
}
