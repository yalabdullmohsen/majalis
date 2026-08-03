import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_search_history_item.dart';
import 'mushaf_search_history_repository.dart';

class SharedPrefsMushafSearchHistoryRepository
    implements MushafSearchHistoryRepository {
  static const String _key = 'mushaf_search_history_v1';
  static const int _maxItems = 20;

  @override
  Future<List<MushafSearchHistoryItem>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    try {
      final decoded = jsonDecode(raw) as List<dynamic>;

      return decoded
          .map(
            (item) => MushafSearchHistoryItem.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .where((item) => item.query.trim().isNotEmpty)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Future<void> add(String query) async {
    final cleaned = query.trim();

    if (cleaned.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final items = await load();

    final updated = [
      MushafSearchHistoryItem(
        query: cleaned,
        searchedAt: DateTime.now(),
      ),
      ...items.where((item) => item.query != cleaned),
    ].take(_maxItems).toList();

    await prefs.setString(
      _key,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
