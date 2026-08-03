import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_page_builder.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('MushafPageBuilder', () {
    test('builds 604 pages', () {
      final ayahs = List.generate(
        100,
        (index) => QuranAyah(
          ref: AyahRef(surah: 1, ayah: index + 1),
          textUthmani: 'نص الآية',
        ),
      );

      const builder = MushafPageBuilder();

      final pages = builder.buildPages(ayahs);

      expect(pages.length, 604);
      expect(pages.any((page) => page.ayahs.isNotEmpty), isTrue);
    });

    test('distributes ayahs without inventing Quran text', () {
      final ayahs = [
        const QuranAyah(
          ref: AyahRef(surah: 1, ayah: 1),
          textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        ),
      ];

      const builder = MushafPageBuilder();
      final pages = builder.buildPages(ayahs);

      final texts = pages.expand((page) => page.ayahs).map((a) => a.textUthmani);
      expect(texts, contains('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'));
    });
  });
}
