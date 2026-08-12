import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_session_record.dart';
import 'tasmee3_session_repository.dart';

class LocalTasmee3SessionRepository implements Tasmee3SessionRepository {
  static const String _key = 'tasmee3_sessions';

  @override
  Future<List<Tasmee3SessionRecord>> getSessions() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded.map((item) {
      final map = item as Map<String, dynamic>;

      return Tasmee3SessionRecord.fromJson(map, (json) {
        final modeName = json['mode'] as String;
        final mode = Tasmee3Mode.values.firstWhere(
          (value) => value.name == modeName,
          orElse: () => Tasmee3Mode.showText,
        );

        return RecitationTarget(
          from: AyahRef(
            surah: json['fromSurah'] as int,
            ayah: json['fromAyah'] as int,
          ),
          to: AyahRef(
            surah: json['toSurah'] as int,
            ayah: json['toAyah'] as int,
          ),
          mode: mode,
        );
      });
    }).toList();
  }

  @override
  Future<void> saveSession(Tasmee3SessionRecord record) async {
    final prefs = await SharedPreferences.getInstance();
    final sessions = await getSessions();

    final updated = [record, ...sessions].take(50).toList();

    final raw = jsonEncode(updated.map((e) => e.toJson()).toList());
    await prefs.setString(_key, raw);
  }

  @override
  Future<void> clearSessions() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
