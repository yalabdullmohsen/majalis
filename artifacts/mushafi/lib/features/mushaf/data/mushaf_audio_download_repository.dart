import '../domain/mushaf_audio_download.dart';

abstract class MushafAudioDownloadRepository {
  Future<List<MushafAudioDownload>> getAll();

  Future<MushafAudioDownload?> find({
    required String reciterId,
    required int surah,
    required int ayah,
  });

  Future<void> save(MushafAudioDownload download);

  Future<void> remove(String id);

  Future<void> removeByReciter(String reciterId);

  Future<void> clearAll();
}
