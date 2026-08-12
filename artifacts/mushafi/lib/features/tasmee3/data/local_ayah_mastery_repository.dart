import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/ayah_mastery_record.dart';
import 'ayah_mastery_repository.dart';

class LocalAyahMasteryRepository implements AyahMasteryRepository {
  static const String _key = 'tasmee3_ayah_mastery_records_v1';

  @override
  Future<List<AyahMasteryRecord>> loadAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map((item) =>
            AyahMasteryRecord.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> saveAll(List<AyahMasteryRecord> records) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _key,
      jsonEncode(records.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> upsertMany(List<AyahMasteryRecord> records) async {
    final existing = await loadAll();

    final map = {
      for (final item in existing) item.ayahRef.key: item,
    };

    for (final record in records) {
      map[record.ayahRef.key] = record;
    }

    await saveAll(map.values.toList());
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
