import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_ayah_review_marker.dart';
import 'mushaf_review_marker_repository.dart';

class SharedPrefsMushafReviewMarkerRepository
    implements MushafReviewMarkerRepository {
  static const String _key = 'mushaf_review_markers_v1';

  @override
  Future<List<MushafAyahReviewMarker>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map(
          (item) => MushafAyahReviewMarker.fromJson(
            item as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  @override
  Future<List<MushafAyahReviewMarker>> getByAyah({
    required int surah,
    required int ayah,
  }) async {
    final all = await getAll();

    return all.where((item) {
      return item.surah == surah && item.ayah == ayah;
    }).toList();
  }

  @override
  Future<void> saveAll(List<MushafAyahReviewMarker> markers) async {
    final prefs = await SharedPreferences.getInstance();
    final existing = await getAll();

    final markerKeys = markers.map((item) => item.key).toSet();

    final updated = [
      ...markers,
      ...existing.where((item) => !markerKeys.contains(item.key)),
    ];

    await prefs.setString(
      _key,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> removeForAyah({
    required int surah,
    required int ayah,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final all = await getAll();

    final updated = all.where((item) {
      return !(item.surah == surah && item.ayah == ayah);
    }).toList();

    await prefs.setString(
      _key,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
