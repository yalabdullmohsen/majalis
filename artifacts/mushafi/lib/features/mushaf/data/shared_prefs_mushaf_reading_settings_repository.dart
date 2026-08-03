import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_reading_settings.dart';
import 'mushaf_reading_settings_repository.dart';

class SharedPrefsMushafReadingSettingsRepository
    implements MushafReadingSettingsRepository {
  static const String _key = 'mushaf_reading_settings_v1';

  @override
  Future<MushafReadingSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const MushafReadingSettings.defaults();
    }

    try {
      return MushafReadingSettings.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
    } catch (_) {
      return const MushafReadingSettings.defaults();
    }
  }

  @override
  Future<void> save(MushafReadingSettings settings) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _key,
      jsonEncode(settings.toJson()),
    );
  }

  @override
  Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
