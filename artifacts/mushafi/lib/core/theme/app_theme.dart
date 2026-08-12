import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/typography.dart';

enum MushafiThemeMode { light, dark, sepia }

class AppTheme {
  AppTheme._();

  static ThemeData of(MushafiThemeMode mode) {
    final colors = MushafiColors.forMode(mode);
    final base = mode == MushafiThemeMode.dark
        ? ThemeData.dark(useMaterial3: true)
        : ThemeData.light(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: colors.scaffold,
      colorScheme: ColorScheme(
        brightness: mode == MushafiThemeMode.dark
            ? Brightness.dark
            : Brightness.light,
        primary: colors.ornament,
        onPrimary: colors.paper,
        secondary: colors.secondaryText,
        onSecondary: colors.paper,
        error: const Color(0xFFB3261E),
        onError: Colors.white,
        surface: colors.paper,
        onSurface: colors.ink,
      ),
      textTheme: MushafiTypography.textTheme(colors),
      appBarTheme: AppBarTheme(
        backgroundColor: colors.paper.withValues(alpha: 0.92),
        foregroundColor: colors.ink,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: MushafiTypography.uiTitle(colors),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.paper,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      dividerColor: colors.ornament.withValues(alpha: 0.25),
    );
  }
}
