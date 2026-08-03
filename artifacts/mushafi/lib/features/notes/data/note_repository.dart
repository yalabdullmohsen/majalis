import 'dart:convert';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class Note extends Equatable {
  const Note({
    required this.id,
    required this.ayahKey,
    required this.content,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ayahKey;
  final String content;
  final DateTime createdAt;
  final DateTime updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'ayahKey': ayahKey,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory Note.fromJson(Map<String, dynamic> j) => Note(
        id: j['id'] as String,
        ayahKey: j['ayahKey'] as String,
        content: j['content'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        updatedAt: DateTime.parse(j['updatedAt'] as String),
      );

  @override
  List<Object?> get props => [id, ayahKey, content];
}

class NoteRepository {
  NoteRepository(this._prefs);
  final SharedPreferences _prefs;
  static const _key = 'notes_v1';
  final _uuid = const Uuid();

  List<Note> list() {
    final raw = _prefs.getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    return (jsonDecode(raw) as List)
        .map((e) => Note.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<Note> items) =>
      _prefs.setString(_key, jsonEncode(items.map((e) => e.toJson()).toList()));

  Future<Note> upsert({required String ayahKey, required String content, String? id}) async {
    final items = list();
    final now = DateTime.now();
    if (id != null) {
      final i = items.indexWhere((n) => n.id == id);
      if (i >= 0) {
        final updated = Note(
          id: id,
          ayahKey: ayahKey,
          content: content,
          createdAt: items[i].createdAt,
          updatedAt: now,
        );
        items[i] = updated;
        await _save(items);
        return updated;
      }
    }
    final n = Note(
      id: _uuid.v4(),
      ayahKey: ayahKey,
      content: content,
      createdAt: now,
      updatedAt: now,
    );
    items.insert(0, n);
    await _save(items);
    return n;
  }
}

final noteRepositoryProvider = Provider<NoteRepository>((ref) {
  return NoteRepository(ref.watch(sharedPreferencesProvider));
});
