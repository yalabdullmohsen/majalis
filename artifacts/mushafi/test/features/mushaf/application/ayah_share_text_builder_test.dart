import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/ayah_share_text_builder.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('AyahShareTextBuilder', () {
    test('builds text for single ayah', () {
      const builder = AyahShareTextBuilder();

      final text = builder.buildText(
        const [
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 1),
            textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
          ),
        ],
      );

      expect(text.contains('قُلْ هُوَ ٱللَّهُ أَحَدٌ'), true);
      expect(text.contains('(112:1)'), true);
      expect(text.contains('مصحفي'), true);
    });

    test('builds reference for ayah range', () {
      const builder = AyahShareTextBuilder();

      final reference = builder.buildReference(
        const [
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 1),
            textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
          ),
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 2),
            textUthmani: 'ٱللَّهُ ٱلصَّمَدُ',
          ),
        ],
      );

      expect(reference, 'سورة 112 - من آية 1 إلى 2');
    });
  });
}
