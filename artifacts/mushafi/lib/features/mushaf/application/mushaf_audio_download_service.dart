import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../data/mushaf_audio_download_repository.dart';
import '../domain/mushaf_audio_download.dart';
import '../domain/quran_reciter.dart';

class MushafAudioDownloadService {
  final MushafAudioDownloadRepository repository;

  const MushafAudioDownloadService({
    required this.repository,
  });

  Future<MushafAudioDownload> downloadAyah({
    required QuranReciter reciter,
    required QuranAyah ayah,
  }) async {
    if (!reciter.isConfigured) {
      throw StateError(
        'لا يوجد مصدر صوت مرخص لهذا القارئ. أضف رابطا صوتيا مرخصا أولا.',
      );
    }

    final existing = await repository.find(
      reciterId: reciter.id,
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
    );

    if (existing != null) {
      return existing;
    }

    final url = reciter.ayahUrl(
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
    );

    final uri = Uri.parse(url);
    final response = await http.get(uri);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError('تعذر تنزيل صوت الآية. تحقق من مصدر الصوت.');
    }

    if (response.bodyBytes.isEmpty) {
      throw StateError('ملف الصوت فارغ.');
    }

    final dir = await _downloadsDirectory(reciter.id);

    final surahPadded = ayah.ref.surah.toString().padLeft(3, '0');
    final ayahPadded = ayah.ref.ayah.toString().padLeft(3, '0');

    final file = File(
      '${dir.path}/${surahPadded}_$ayahPadded.${reciter.fileExtension}',
    );

    await file.writeAsBytes(response.bodyBytes);

    final download = MushafAudioDownload(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      reciterId: reciter.id,
      surah: ayah.ref.surah,
      ayah: ayah.ref.ayah,
      localPath: file.path,
      fileSizeBytes: response.bodyBytes.length,
      downloadedAt: DateTime.now(),
    );

    await repository.save(download);

    return download;
  }

  Future<List<MushafAudioDownload>> downloadRange({
    required QuranReciter reciter,
    required List<QuranAyah> ayahs,
    void Function(int completed, int total)? onProgress,
  }) async {
    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);
      if (surahCompare != 0) return surahCompare;
      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    final result = <MushafAudioDownload>[];

    for (var i = 0; i < sorted.length; i++) {
      final item = await downloadAyah(
        reciter: reciter,
        ayah: sorted[i],
      );

      result.add(item);
      onProgress?.call(i + 1, sorted.length);
    }

    return result;
  }

  Future<Directory> _downloadsDirectory(String reciterId) async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/mushaf_audio/$reciterId');

    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }

    return dir;
  }
}
