import 'ayah_card_theme.dart';

class AyahCardSettings {
  final AyahCardThemeType theme;
  final double fontSize;
  final bool showReference;
  final bool showBrand;
  final bool showDivider;
  final bool centerText;

  const AyahCardSettings({
    required this.theme,
    required this.fontSize,
    required this.showReference,
    required this.showBrand,
    required this.showDivider,
    required this.centerText,
  });

  const AyahCardSettings.defaults()
      : theme = AyahCardThemeType.parchment,
        fontSize = 26,
        showReference = true,
        showBrand = true,
        showDivider = true,
        centerText = true;

  AyahCardSettings copyWith({
    AyahCardThemeType? theme,
    double? fontSize,
    bool? showReference,
    bool? showBrand,
    bool? showDivider,
    bool? centerText,
  }) {
    return AyahCardSettings(
      theme: theme ?? this.theme,
      fontSize: fontSize ?? this.fontSize,
      showReference: showReference ?? this.showReference,
      showBrand: showBrand ?? this.showBrand,
      showDivider: showDivider ?? this.showDivider,
      centerText: centerText ?? this.centerText,
    );
  }
}
