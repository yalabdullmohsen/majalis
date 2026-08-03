import 'dart:convert';
import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/mushaf_audio_download.dart';
import 'mushaf_audio_download_repository.dart';

class SharedPrefsMushafAudioDownloadRepository
    implements MushafAudioDownloadRepository {
  static const String _key = 'mushaf_audio_downloads_v1';

  @override
  Future<List<MushafAudioDownload>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    try {
      final decoded = jsonDecode(raw) as List<dynamic>;

      return decoded
          .map(
            (item) => MushafAudioDownload.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Future<MushafAudioDownload?> find({
    required String reciterId,
    required int surah,
    required int ayah,
  }) async {
    final key = MushafAudioDownload.buildKey(
      reciterId: reciterId,
      surah: surah,
      ayah: ayah,
    );

    final items = await getAll();

    for (final item in items) {
      if (item.key == key && await File(item.localPath).exists()) {
        return item;
      }
    }

    return null;
  }

  @override
  Future<void> save(MushafAudioDownload download) async {
    final items = await getAll();

    final updated = [
      download,
      ...items.where((item) => item.key != download.key),
    ];

    await _saveAll(updated);
  }

  @override
  Future<void> remove(String id) async {
    final items = await getAll();
    final removed = items.where((item) => item.id == id).toList();

    for (final item in removed) {
      await _deleteFile(item.localPath);
    }

    final updated = items.where((item) => item.id != id).toList();

    await _saveAll(updated);
  }

  @override
  Future<void> removeByReciter(String reciterId) async {
    final items = await getAll();

    for (final item in items.where((item) => item.reciterId == reciterId)) {
      await _deleteFile(item.localPath);
    }

    final updated = items.where((item) => item.reciterId != reciterId).toList();

    await _saveAll(updated);
  }

  @override
  Future<void> clearAll() async {
    final items = await getAll();

    for (final item in items) {
      await _deleteFile(item.localPath);
    }

    await _saveAll(const []);
  }

  Future<void> _saveAll(List<MushafAudioDownload> items) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _key,
      jsonEncode(items.map((item) => item.toJson()).toList()),
    );
  }

  Future<void> _deleteFile(String path) async {
    try {
      final file = File(path);

      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {}
  }
}
