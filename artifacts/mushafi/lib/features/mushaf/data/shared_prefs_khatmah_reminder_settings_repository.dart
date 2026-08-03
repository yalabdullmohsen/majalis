import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/khatmah_reminder_settings.dart';
import 'khatmah_reminder_settings_repository.dart';

class SharedPrefsKhatmahReminderSettingsRepository
    implements KhatmahReminderSettingsRepository {
  static const String _key = 'mushaf_khatmah_reminder_settings_v1';

  @override
  Future<KhatmahReminderSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const KhatmahReminderSettings.defaults();
    }

    try {
      return KhatmahReminderSettings.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
    } catch (_) {
      return const KhatmahReminderSettings.defaults();
    }
  }

  @override
  Future<void> save(KhatmahReminderSettings settings) async {
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
