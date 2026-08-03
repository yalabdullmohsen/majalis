import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_audio_download.dart';

void main() {
  group('MushafAudioDownload', () {
    test('builds stable key', () {
      final key = MushafAudioDownload.buildKey(
        reciterId: 'husary',
        surah: 2,
        ayah: 255,
      );

      expect(key, 'husary:2:255');
    });

    test('serializes and deserializes', () {
      final download = MushafAudioDownload(
        id: '1',
        reciterId: 'husary',
        surah: 1,
        ayah: 1,
        localPath: '/tmp/001001.mp3',
        fileSizeBytes: 100,
        downloadedAt: DateTime(2026),
      );

      final restored = MushafAudioDownload.fromJson(download.toJson());

      expect(restored.key, download.key);
      expect(restored.fileSizeBytes, 100);
    });
  });
}
