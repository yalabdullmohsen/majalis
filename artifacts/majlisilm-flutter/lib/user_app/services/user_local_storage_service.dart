import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../shared/constants/majlis_constants.dart';
import '../../shared/models/shared_adhkar_item.dart';
import '../../shared/models/shared_course_progress.dart';

/// User-module [shared_preferences] singleton.
class UserLocalStorageService {
  UserLocalStorageService._();
  static final UserLocalStorageService instance = UserLocalStorageService._();

  SharedPreferences? _prefs;

  Future<SharedPreferences> _ensure() async {
    return _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> saveFontSize(double size) async {
    final p = await _ensure();
    final clamped = size.clamp(MajlisConstants.fontMin, MajlisConstants.fontMax);
    await p.setDouble(MajlisConstants.prefsFontSize, clamped);
  }

  Future<double> getFontSize() async {
    final p = await _ensure();
    return p.getDouble(MajlisConstants.prefsFontSize) ?? MajlisConstants.fontDefault;
  }

  Future<void> saveDarkMode(bool dark) async {
    final p = await _ensure();
    await p.setBool(MajlisConstants.prefsDarkMode, dark);
  }

  Future<bool> getDarkMode() async {
    final p = await _ensure();
    return p.getBool(MajlisConstants.prefsDarkMode) ?? false;
  }

  Future<void> saveLastVerseIndex(int index, {int surah = 1}) async {
    if (index < 0) return;
    final p = await _ensure();
    await p.setInt(MajlisConstants.prefsLastVerse, index);
    await p.setInt(MajlisConstants.prefsLastSurah, surah);
  }

  Future<int?> getLastVerseIndex() async {
    final p = await _ensure();
    if (!p.containsKey(MajlisConstants.prefsLastVerse)) return null;
    return p.getInt(MajlisConstants.prefsLastVerse);
  }

  Future<int> getLastSurah() async {
    final p = await _ensure();
    return p.getInt(MajlisConstants.prefsLastSurah) ?? 1;
  }

  Future<void> saveCourses(List<SharedCourseProgress> courses) async {
    final p = await _ensure();
    final encoded = jsonEncode(courses.map((c) => c.toJson()).toList());
    await p.setString(MajlisConstants.prefsCourses, encoded);
  }

  Future<List<SharedCourseProgress>?> loadCourses() async {
    final p = await _ensure();
    final raw = p.getString(MajlisConstants.prefsCourses);
    if (raw == null || raw.isEmpty) return null;
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => SharedCourseProgress.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveAdhkar(List<SharedAdhkarItem> items) async {
    final p = await _ensure();
    final encoded = jsonEncode(items.map((a) => a.toJson()).toList());
    await p.setString(MajlisConstants.prefsAdhkar, encoded);
  }

  Future<List<SharedAdhkarItem>?> loadAdhkar() async {
    final p = await _ensure();
    final raw = p.getString(MajlisConstants.prefsAdhkar);
    if (raw == null || raw.isEmpty) return null;
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => SharedAdhkarItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
