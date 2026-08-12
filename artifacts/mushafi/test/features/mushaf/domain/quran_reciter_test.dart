import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/domain/quran_reciter.dart';

void main() {
  group('QuranReciter', () {
    test('builds ayah url', () {
      const reciter = QuranReciter(
        id: 'test',
        nameArabic: 'قارئ',
        riwayah: 'حفص',
        audioBaseUrl: 'https://example.com/audio',
      );

      final url = reciter.ayahUrl(surah: 2, ayah: 5);

      expect(url, 'https://example.com/audio/002005.mp3');
    });

    test('detects empty audio source', () {
      const reciter = QuranReciter(
        id: 'test',
        nameArabic: 'قارئ',
        riwayah: 'حفص',
        audioBaseUrl: '',
      );

      expect(reciter.isConfigured, false);
    });
  });
}
