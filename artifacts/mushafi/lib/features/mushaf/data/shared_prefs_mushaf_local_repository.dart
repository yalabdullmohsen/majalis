import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_bookmark.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_note.dart';
import '../domain/mushaf_reading_position.dart';
import 'mushaf_local_repository.dart';

class SharedPrefsMushafLocalRepository implements MushafLocalRepository {
  static const _lastPositionKey = 'mushaf_reader_last_position';
  static const _bookmarksKey = 'mushaf_reader_bookmarks';
  static const _favoritesKey = 'mushaf_reader_favorites';
  static const _notesKey = 'mushaf_reader_notes';

  @override
  Future<MushafReadingPosition?> getLastPosition() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_lastPositionKey);

    if (raw == null || raw.trim().isEmpty) return null;

    return MushafReadingPosition.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
  }

  @override
  Future<void> saveLastPosition(MushafReadingPosition position) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastPositionKey, jsonEncode(position.toJson()));
  }

  @override
  Future<List<MushafBookmark>> getBookmarks() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_bookmarksKey);

    if (raw == null || raw.trim().isEmpty) return const [];

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map((item) => MushafBookmark.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> saveBookmark(MushafBookmark bookmark) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await getBookmarks();

    final updated = [
      bookmark,
      ...items.where((item) => item.id != bookmark.id),
    ];

    await prefs.setString(
      _bookmarksKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> removeBookmark(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await getBookmarks();

    final updated = items.where((item) => item.id != id).toList();

    await prefs.setString(
      _bookmarksKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<List<MushafFavoriteAyah>> getFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_favoritesKey);

    if (raw == null || raw.trim().isEmpty) return const [];

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map(
          (item) =>
              MushafFavoriteAyah.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<void> toggleFavorite(MushafFavoriteAyah favorite) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await getFavorites();

    final exists = items.any((item) => item.key == favorite.key);

    final updated = exists
        ? items.where((item) => item.key != favorite.key).toList()
        : [favorite, ...items];

    await prefs.setString(
      _favoritesKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<List<MushafNote>> getNotes() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_notesKey);

    if (raw == null || raw.trim().isEmpty) return const [];

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map((item) => MushafNote.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> saveNote(MushafNote note) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await getNotes();

    final updated = [
      note,
      ...items.where((item) => item.id != note.id),
    ];

    await prefs.setString(
      _notesKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> removeNote(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await getNotes();

    final updated = items.where((item) => item.id != id).toList();

    await prefs.setString(
      _notesKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }
}
