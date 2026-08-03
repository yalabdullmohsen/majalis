enum MushafFontFamily {
  system,
  notoNaskh,
  uthmanic,
}

extension MushafFontFamilyLabel on MushafFontFamily {
  String get arabicLabel {
    switch (this) {
      case MushafFontFamily.system:
        return 'خط النظام';
      case MushafFontFamily.notoNaskh:
        return 'Noto Naskh Arabic';
      case MushafFontFamily.uthmanic:
        return 'خط عثماني';
    }
  }

  /// Returns a registered font family name, or null for the platform default.
  ///
  /// `uthmanic` maps to `UthmanicHafs` only when that licensed font is bundled;
  /// otherwise Flutter falls back to the system font.
  String? get fontFamily {
    switch (this) {
      case MushafFontFamily.system:
        return null;
      case MushafFontFamily.notoNaskh:
        return 'NotoNaskhArabic';
      case MushafFontFamily.uthmanic:
        return 'UthmanicHafs';
    }
  }
}
