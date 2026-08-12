import 'dart:convert';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class Bookmark extends Equatable {
  const Bookmark({
    required this.id,
    required this.ayahKey,
    required this.pageNumber,
    required this.color,
    required this.title,
    required this.createdAt,
  });

  final String id;
  final String ayahKey;
  final int pageNumber;
  final int color;
  final String title;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'ayahKey': ayahKey,
        'pageNumber': pageNumber,
        'color': color,
        'title': title,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Bookmark.fromJson(Map<String, dynamic> j) => Bookmark(
        id: j['id'] as String,
        ayahKey: j['ayahKey'] as String,
        pageNumber: j['pageNumber'] as int,
        color: j['color'] as int,
        title: j['title'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );

  @override
  List<Object?> get props => [id, ayahKey];
}

class BookmarkRepository {
  BookmarkRepository(this._prefs);
  final SharedPreferences _prefs;
  static const _key = 'bookmarks_v1';
  final _uuid = const Uuid();

  List<Bookmark> list() {
    final raw = _prefs.getString(_key);
    if (raw == null || raw.isEmpty) return <Bookmark>[];
    final list = jsonDecode(raw) as List;
    return list
        .map((e) => Bookmark.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<Bookmark> items) async {
    await _prefs.setString(
      _key,
      jsonEncode(items.map((e) => e.toJson()).toList()),
    );
  }

  Future<Bookmark> addForAyah(Ayah ayah, {String title = 'مفضلة', int color = 0xFFA77A48}) async {
    final items = List<Bookmark>.from(list());
    final b = Bookmark(
      id: _uuid.v4(),
      ayahKey: ayah.key,
      pageNumber: ayah.pageNumber,
      color: color,
      title: title,
      createdAt: DateTime.now(),
    );
    items.insert(0, b);
    await _save(items);
    return b;
  }

  Future<void> remove(String id) async {
    final items = List<Bookmark>.from(list()).where((b) => b.id != id).toList();
    await _save(items);
  }
}

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  return BookmarkRepository(ref.watch(sharedPreferencesProvider));
});
