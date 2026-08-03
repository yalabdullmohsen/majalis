enum MushafReadingTheme {
  light,
  sepia,
  night,
  pureBlack,
}

extension MushafReadingThemeLabel on MushafReadingTheme {
  String get arabicLabel {
    switch (this) {
      case MushafReadingTheme.light:
        return 'فاتح';
      case MushafReadingTheme.sepia:
        return 'ورقي';
      case MushafReadingTheme.night:
        return 'ليلي';
      case MushafReadingTheme.pureBlack:
        return 'أسود';
    }
  }

  bool get isDark =>
      this == MushafReadingTheme.night || this == MushafReadingTheme.pureBlack;
}
