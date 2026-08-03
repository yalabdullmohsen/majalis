import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/mistake_detection_engine.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_mistake.dart';

void main() {
  group('MistakeDetectionEngine', () {
    const ayahs = [
      QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      ),
    ];

    test('detects perfect recitation', () {
      const engine = MistakeDetectionEngine();

      final result = engine.analyze(
        expectedAyahs: ayahs,
        recognizedText: 'قل هو الله احد',
        confidence: 0.9,
      );

      expect(result.accuracy, 1);
      expect(result.mistakesCount, 0);
    });

    test('detects missing word', () {
      const engine = MistakeDetectionEngine();

      final result = engine.analyze(
        expectedAyahs: ayahs,
        recognizedText: 'قل الله احد',
        confidence: 0.9,
      );

      expect(
        result.mistakes.any(
          (mistake) => mistake.type == Tasmee3MistakeType.missingWord,
        ),
        isTrue,
      );
    });

    test('detects wrong word', () {
      const engine = MistakeDetectionEngine();

      final result = engine.analyze(
        expectedAyahs: ayahs,
        recognizedText: 'قل هو الرحمن احد',
        confidence: 0.9,
      );

      expect(
        result.mistakes.any(
          (mistake) => mistake.type == Tasmee3MistakeType.wrongWord,
        ),
        isTrue,
      );
    });

    test('adds low confidence warning', () {
      const engine = MistakeDetectionEngine();

      final result = engine.analyze(
        expectedAyahs: ayahs,
        recognizedText: 'قل هو الله احد',
        confidence: 0.3,
      );

      expect(
        result.mistakes.any(
          (mistake) => mistake.type == Tasmee3MistakeType.lowConfidence,
        ),
        isTrue,
      );
    });
  });
}
