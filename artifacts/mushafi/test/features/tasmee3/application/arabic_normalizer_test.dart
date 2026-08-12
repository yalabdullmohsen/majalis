import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';

void main() {
  group('ArabicNormalizer', () {
    test('removes tashkeel and tatweel', () {
      final result = ArabicNormalizer.normalize('قُلْ هُوَ ٱللَّهُ أَحَدٌ');

      expect(result, 'قل هو الله احد');
    });

    test('normalizes hamzahs and alif variants', () {
      final result = ArabicNormalizer.normalize('أإآٱ');

      expect(result, 'اااا');
    });

    test('normalizes ya and ta marbuta', () {
      final result = ArabicNormalizer.normalize('هدى رحمة');

      expect(result, 'هدي رحمه');
    });

    test('tokenizes Arabic text', () {
      final result = ArabicNormalizer.tokenize('قُلْ هُوَ ٱللَّهُ أَحَدٌ');

      expect(result, ['قل', 'هو', 'الله', 'احد']);
    });

    test('returns empty list for empty input', () {
      final result = ArabicNormalizer.tokenize('');

      expect(result, isEmpty);
    });
  });
}
