abstract final class MajlisConstants {
  static const double fontMin = 20;
  static const double fontMax = 42;
  static const double fontDefault = 28;
  static const double lineHeight = 2.1;

  static const String prefsFontSize = 'majlisilm_user_font_size_v1';
  static const String prefsDarkMode = 'majlisilm_user_dark_v1';
  static const String prefsLastVerse = 'majlisilm_user_last_verse_v1';
  static const String prefsLastSurah = 'majlisilm_user_last_surah_v1';
  static const String prefsCourses = 'majlisilm_user_courses_v1';
  static const String prefsAdhkar = 'majlisilm_user_adhkar_v1';

  /// everyayah Alafasy pattern.
  static String ayahAudioUrl(int surah, int ayah, {String reciter = 'Alafasy_128kbps'}) {
    final s = surah.toString().padLeft(3, '0');
    final a = ayah.toString().padLeft(3, '0');
    return 'https://everyayah.com/data/$reciter/$s$a.mp3';
  }
}
