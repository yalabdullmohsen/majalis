import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/khatmah/domain/khatmah_models.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';
import 'package:mushafi/features/tasmee3/application/mistake_detection_engine.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_mistake.dart';

void main() {
  group('ArabicNormalizer', () {
    test('removes tashkeel via normalize', () {
      expect(ArabicNormalizer.normalize('بِسْمِ'), 'بسم');
    });

    test('normalize unifies hamza and ya', () {
      expect(ArabicNormalizer.normalize('إبراهيم'), contains('ابراهيم'));
      expect(ArabicNormalizer.normalize('على'), 'علي');
    });
  });

  group('MistakeDetectionEngine', () {
    const engine = MistakeDetectionEngine();

    test('detects missing word', () {
      const ayah = QuranAyah(
        ref: AyahRef(surah: 1, ayah: 2),
        textUthmani: 'ٱلْحَمْدُ لِلَّهِ',
      );
      final result = engine.analyze(
        expectedAyahs: const [ayah],
        recognizedText: 'الحمد',
        confidence: 0.9,
      );
      expect(
        result.mistakes.any((e) => e.type == Tasmee3MistakeType.missingWord),
        isTrue,
      );
    });

    test('detects wrong word', () {
      const ayah = QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ',
      );
      final result = engine.analyze(
        expectedAyahs: const [ayah],
        recognizedText: 'قل هي',
        confidence: 0.9,
      );
      expect(
        result.mistakes.any((e) => e.type == Tasmee3MistakeType.wrongWord),
        isTrue,
      );
    });
  });

  group('KhatmahProgressCalculator', () {
    test('progress and remaining', () {
      expect(
        KhatmahProgressCalculator.progress(completed: 151, total: 604),
        closeTo(0.25, 0.01),
      );
      expect(
        KhatmahProgressCalculator.remaining(completed: 100, total: 604),
        504,
      );
    });
  });
}
