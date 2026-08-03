enum AyahCardThemeType {
  parchment,
  night,
  sand,
  emerald,
  minimal,
}

extension AyahCardThemeTypeLabel on AyahCardThemeType {
  String get arabicLabel {
    switch (this) {
      case AyahCardThemeType.parchment:
        return 'رق قديم';
      case AyahCardThemeType.night:
        return 'ليلي';
      case AyahCardThemeType.sand:
        return 'رملي';
      case AyahCardThemeType.emerald:
        return 'زمردي';
      case AyahCardThemeType.minimal:
        return 'بسيط';
    }
  }
}
