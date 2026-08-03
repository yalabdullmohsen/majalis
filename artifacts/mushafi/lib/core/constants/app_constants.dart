/// ثوابت التطبيق — لا تتضمّن نصًا قرآنيًا.
class AppConstants {
  static const String appName = 'مصحفي';
  static const String appNameEn = 'Mushafi';
  static const int expectedSurahCount = 114;
  /// ترقيم حفص المتداول (مع البسملة المعدودة في الفاتحة فقط كآية).
  static const int expectedAyahCountHafs = 6236;
  static const int totalMadinahPages = 604;
  static const String quranAssetPath = 'assets/data/quran_uthmani.json';
  static const String quranMetaPath = 'assets/data/quran_meta.json';
  static const String prefsLastPage = 'last_page';
  static const String prefsThemeMode = 'theme_mode';
  static const String prefsFontScale = 'font_scale';
  static const String prefsReadingMode = 'reading_mode';
  static const String prefsKeepAwake = 'keep_awake';
  static const String prefsDigitStyle = 'digit_style';
  static const String prefsReciterId = 'reciter_id';
}
