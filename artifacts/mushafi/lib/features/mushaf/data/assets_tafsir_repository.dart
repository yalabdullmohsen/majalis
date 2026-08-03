import 'dart:convert';

import 'package:flutter/services.dart';

import '../domain/tafsir_entry.dart';
import '../domain/tafsir_source.dart';
import 'tafsir_repository.dart';

class AssetsTafsirRepository implements TafsirRepository {
  final Map<String, Map<String, TafsirEntry>> _cache = {};

  @override
  Future<TafsirEntry?> getTafsir({
    required TafsirSource source,
    required int surah,
    required int ayah,
  }) async {
    final sourceCache = await _loadSource(source);
    return sourceCache['$surah:$ayah'];
  }

  Future<Map<String, TafsirEntry>> _loadSource(TafsirSource source) async {
    final cached = _cache[source.id];

    if (cached != null) {
      return cached;
    }

    try {
      final raw = await rootBundle.loadString(source.assetPath);
      final decoded = jsonDecode(raw) as List<dynamic>;

      final entries = <String, TafsirEntry>{};

      for (final item in decoded) {
        final entry = TafsirEntry.fromJson(item as Map<String, dynamic>);
        entries[entry.key] = entry;
      }

      _cache[source.id] = entries;
      return entries;
    } catch (_) {
      _cache[source.id] = {};
      return {};
    }
  }
}
