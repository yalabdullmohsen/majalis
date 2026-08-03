import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/features/quran/domain/mushaf_layout_engine.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsRepository {
  SettingsRepository(this._prefs);
  final SharedPreferences _prefs;

  int get lastPage => _prefs.getInt(AppConstants.prefsLastPage) ?? 1;

  Future<void> setLastPage(int page) =>
      _prefs.setInt(AppConstants.prefsLastPage, page);

  MushafiThemeMode get themeMode {
    final raw = _prefs.getString(AppConstants.prefsThemeMode) ?? 'light';
    return MushafiThemeMode.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => MushafiThemeMode.light,
    );
  }

  Future<void> setThemeMode(MushafiThemeMode mode) =>
      _prefs.setString(AppConstants.prefsThemeMode, mode.name);

  double get fontScale => _prefs.getDouble(AppConstants.prefsFontScale) ?? 1.0;

  Future<void> setFontScale(double v) =>
      _prefs.setDouble(AppConstants.prefsFontScale, v);

  MushafReadingMode get readingMode {
    final raw = _prefs.getString(AppConstants.prefsReadingMode) ?? 'pageMode';
    return MushafReadingMode.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => MushafReadingMode.pageMode,
    );
  }

  Future<void> setReadingMode(MushafReadingMode mode) =>
      _prefs.setString(AppConstants.prefsReadingMode, mode.name);

  bool get keepAwake => _prefs.getBool(AppConstants.prefsKeepAwake) ?? true;

  Future<void> setKeepAwake(bool v) =>
      _prefs.setBool(AppConstants.prefsKeepAwake, v);

  DigitStyle get digitStyle {
    final raw = _prefs.getString(AppConstants.prefsDigitStyle) ?? 'easternArabic';
    return DigitStyle.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => DigitStyle.easternArabic,
    );
  }

  Future<void> setDigitStyle(DigitStyle style) =>
      _prefs.setString(AppConstants.prefsDigitStyle, style.name);

  String get reciterId =>
      _prefs.getString(AppConstants.prefsReciterId) ?? 'alafasy';

  Future<void> setReciterId(String id) =>
      _prefs.setString(AppConstants.prefsReciterId, id);
}
