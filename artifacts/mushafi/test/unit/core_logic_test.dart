import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/khatmah/domain/khatmah_models.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';
import 'package:mushafi/features/tasmee3/application/mistake_detection_engine.dart';
import 'package:mushafi/features/tasmee3/data/audio_quality_monitor.dart';
import 'package:mushafi/features/tasmee3/domain/aligned_word.dart';
import 'package:mushafi/features/tasmee3/domain/audio_quality_report.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/forced_alignment_result.dart';
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

    test('analyzeAlignment maps missing and mismatch', () {
      const alignment = ForcedAlignmentResult(
        fullText: 'قل هي',
        confidence: 0.8,
        alignedWords: [
          AlignedWord(
            expectedWord: 'قل',
            recognizedWord: 'قل',
            globalWordIndex: 0,
            wordIndexInAyah: 0,
            ayahRef: AyahRef(surah: 112, ayah: 1),
            startMs: 0,
            endMs: 100,
            confidence: 0.9,
            status: AlignedWordStatus.correct,
          ),
          AlignedWord(
            expectedWord: 'هو',
            recognizedWord: 'هي',
            globalWordIndex: 1,
            wordIndexInAyah: 1,
            ayahRef: AyahRef(surah: 112, ayah: 1),
            startMs: 120,
            endMs: 200,
            confidence: 0.8,
            status: AlignedWordStatus.mismatch,
          ),
        ],
      );

      final result = engine.analyzeAlignment(
        alignment: alignment,
        fallbackAyahRef: const AyahRef(surah: 112, ayah: 1),
      );

      expect(result.mistakesCount, 1);
      expect(
        result.mistakes.any((m) => m.type == Tasmee3MistakeType.wrongWord),
        isTrue,
      );
      expect(result.hasLowConfidence, isFalse);
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

  group('AudioQualityMonitor', () {
    test('rejects too-quiet samples', () {
      final monitor = AudioQualityMonitor();
      monitor.start();
      for (var i = 0; i < 20; i++) {
        monitor.addAmplitude(0.01);
      }
      final report = monitor.buildReport();
      expect(report.isTooQuiet, isTrue);
      expect(report.canSubmit, isFalse);
      expect(report.level, AudioQualityLevel.poor);
      monitor.dispose();
    });
  });
}
