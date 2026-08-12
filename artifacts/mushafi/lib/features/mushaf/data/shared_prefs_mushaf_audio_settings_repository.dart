import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_audio_settings.dart';
import 'mushaf_audio_settings_repository.dart';

class SharedPrefsMushafAudioSettingsRepository
    implements MushafAudioSettingsRepository {
  static const String _key = 'mushaf_audio_settings_v1';

  @override
  Future<MushafAudioSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const MushafAudioSettings.defaults();
    }

    try {
      return MushafAudioSettings.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
    } catch (_) {
      return const MushafAudioSettings.defaults();
    }
  }

  @override
  Future<void> save(MushafAudioSettings settings) async {
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
