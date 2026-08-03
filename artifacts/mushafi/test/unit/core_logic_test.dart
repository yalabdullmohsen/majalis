import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/core/utils/arabic_normalizer.dart';
import 'package:mushafi/features/khatmah/domain/khatmah_models.dart';
import 'package:mushafi/features/tarteel/domain/mistake_detection_engine.dart';

void main() {
  group('ArabicNormalizer', () {
    test('removes tashkeel', () {
      expect(
        ArabicNormalizer.removeTashkeel('بِسْمِ'),
        'بسم',
      );
    });

    test('forSearch unifies hamza and ya', () {
      expect(
        ArabicNormalizer.forSearch('إبراهيم'),
        contains('ابراهيم'),
      );
      expect(ArabicNormalizer.forSearch('على'), 'علي');
    });
  });

  group('MistakeDetectionEngine', () {
    final engine = MistakeDetectionEngine();

    test('detects missing word', () {
      final m = engine.compare(
        expectedWords: ['الحمد', 'لله'],
        recognizedWords: ['الحمد'],
        ayahNumber: 2,
      );
      expect(m.any((e) => e.mistakeType == MistakeType.missing), isTrue);
    });

    test('detects wrong word', () {
      final m = engine.compare(
        expectedWords: ['قل', 'هو'],
        recognizedWords: ['قل', 'هي'],
        ayahNumber: 1,
      );
      expect(m.any((e) => e.mistakeType == MistakeType.wrongWord), isTrue);
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
