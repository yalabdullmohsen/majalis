import 'mushaf_font_family.dart';
import 'mushaf_reading_theme.dart';

class MushafReadingSettings {
  final double fontSize;
  final double lineHeight;
  final double wordSpacing;
  final double pagePadding;
  final MushafFontFamily fontFamily;
  final MushafReadingTheme theme;
  final bool showPageHeader;
  final bool showPageFooter;
  final bool highlightTappedAyah;
  final bool keepScreenAwake;

  const MushafReadingSettings({
    required this.fontSize,
    required this.lineHeight,
    required this.wordSpacing,
    required this.pagePadding,
    required this.fontFamily,
    required this.theme,
    required this.showPageHeader,
    required this.showPageFooter,
    required this.highlightTappedAyah,
    required this.keepScreenAwake,
  });

  const MushafReadingSettings.defaults()
      : fontSize = 25,
        lineHeight = 1.9,
        wordSpacing = 4,
        pagePadding = 18,
        fontFamily = MushafFontFamily.system,
        theme = MushafReadingTheme.sepia,
        showPageHeader = true,
        showPageFooter = true,
        highlightTappedAyah = true,
        keepScreenAwake = false;

  MushafReadingSettings copyWith({
    double? fontSize,
    double? lineHeight,
    double? wordSpacing,
    double? pagePadding,
    MushafFontFamily? fontFamily,
    MushafReadingTheme? theme,
    bool? showPageHeader,
    bool? showPageFooter,
    bool? highlightTappedAyah,
    bool? keepScreenAwake,
  }) {
    return MushafReadingSettings(
      fontSize: fontSize ?? this.fontSize,
      lineHeight: lineHeight ?? this.lineHeight,
      wordSpacing: wordSpacing ?? this.wordSpacing,
      pagePadding: pagePadding ?? this.pagePadding,
      fontFamily: fontFamily ?? this.fontFamily,
      theme: theme ?? this.theme,
      showPageHeader: showPageHeader ?? this.showPageHeader,
      showPageFooter: showPageFooter ?? this.showPageFooter,
      highlightTappedAyah: highlightTappedAyah ?? this.highlightTappedAyah,
      keepScreenAwake: keepScreenAwake ?? this.keepScreenAwake,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fontSize': fontSize,
      'lineHeight': lineHeight,
      'wordSpacing': wordSpacing,
      'pagePadding': pagePadding,
      'fontFamily': fontFamily.name,
      'theme': theme.name,
      'showPageHeader': showPageHeader,
      'showPageFooter': showPageFooter,
      'highlightTappedAyah': highlightTappedAyah,
      'keepScreenAwake': keepScreenAwake,
    };
  }

  factory MushafReadingSettings.fromJson(Map<String, dynamic> json) {
    final fontName = json['fontFamily'] as String?;
    final themeName = json['theme'] as String?;

    final fontFamily = MushafFontFamily.values.firstWhere(
      (item) => item.name == fontName,
      orElse: () => MushafFontFamily.system,
    );

    final theme = MushafReadingTheme.values.firstWhere(
      (item) => item.name == themeName,
      orElse: () => MushafReadingTheme.sepia,
    );

    return MushafReadingSettings(
      fontSize: (json['fontSize'] as num?)?.toDouble() ?? 25,
      lineHeight: (json['lineHeight'] as num?)?.toDouble() ?? 1.9,
      wordSpacing: (json['wordSpacing'] as num?)?.toDouble() ?? 4,
      pagePadding: (json['pagePadding'] as num?)?.toDouble() ?? 18,
      fontFamily: fontFamily,
      theme: theme,
      showPageHeader: json['showPageHeader'] as bool? ?? true,
      showPageFooter: json['showPageFooter'] as bool? ?? true,
      highlightTappedAyah: json['highlightTappedAyah'] as bool? ?? true,
      keepScreenAwake: json['keepScreenAwake'] as bool? ?? false,
    );
  }
}
