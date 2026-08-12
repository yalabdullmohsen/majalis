import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_live_follow_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_live_word_status.dart';

void main() {
  group('Tasmee3LiveFollowService', () {
    const service = Tasmee3LiveFollowService();

    const ayahs = [
      QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      ),
    ];

    test('initializes live progress', () {
      final progress = service.initialize(ayahs);

      expect(progress.totalWords, 4);
      expect(progress.currentWordIndex, 0);
      expect(progress.words.first.status, Tasmee3LiveWordStatus.current);
    });

    test('updates recognized words', () {
      final initial = service.initialize(ayahs);

      final updated = service.updateWithRecognizedText(
        current: initial,
        recognizedText: 'قل هو',
        confidence: 0.9,
      );

      expect(updated.recognizedCount, greaterThanOrEqualTo(2));
      expect(updated.progress, greaterThan(0));
    });
  });
}
