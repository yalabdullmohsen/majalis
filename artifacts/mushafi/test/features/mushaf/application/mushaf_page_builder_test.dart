import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_page_builder.dart';
import 'package:mushafi/features/mushaf/domain/quran_page_metadata.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('MushafPageBuilder', () {
    test('builds 604 approximate pages when metadata empty', () {
      final ayahs = List.generate(
        100,
        (index) => QuranAyah(
          ref: AyahRef(surah: 1, ayah: index + 1),
          textUthmani: 'نص الآية',
        ),
      );

      const builder = MushafPageBuilder();

      final pages = builder.buildPages(
        ayahs: ayahs,
        metadata: const [],
      );

      expect(pages.length, 604);
      expect(pages.any((page) => page.ayahs.isNotEmpty), isTrue);
    });

    test('falls back to approximate pages when metadata is incomplete', () {
      final ayahs = [
        const QuranAyah(
          ref: AyahRef(surah: 1, ayah: 1),
          textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        ),
        const QuranAyah(
          ref: AyahRef(surah: 2, ayah: 1),
          textUthmani: 'الٓمٓ',
        ),
      ];

      const metadata = [
        QuranPageMetadata(
          pageNumber: 1,
          juz: 1,
          hizb: 1,
          rub: 1,
          fromSurah: 1,
          fromAyah: 1,
          toSurah: 1,
          toAyah: 7,
        ),
        QuranPageMetadata(
          pageNumber: 2,
          juz: 1,
          hizb: 1,
          rub: 1,
          fromSurah: 2,
          fromAyah: 1,
          toSurah: 2,
          toAyah: 5,
        ),
      ];

      const builder = MushafPageBuilder();
      final pages = builder.buildPages(
        ayahs: ayahs,
        metadata: metadata,
      );

      expect(pages.length, 604);
      expect(
        pages.expand((page) => page.ayahs).map((a) => a.ref.key),
        containsAll(['1:1', '2:1']),
      );
    });

    test('distributes ayahs without inventing Quran text', () {
      final ayahs = [
        const QuranAyah(
          ref: AyahRef(surah: 1, ayah: 1),
          textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        ),
      ];

      const builder = MushafPageBuilder();
      final pages = builder.buildPages(
        ayahs: ayahs,
        metadata: const [],
      );

      final texts = pages.expand((page) => page.ayahs).map((a) => a.textUthmani);
      expect(texts, contains('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'));
    });

    test('builds pages from full 604 metadata ranges', () {
      final ayahs = [
        const QuranAyah(
          ref: AyahRef(surah: 1, ayah: 1),
          textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        ),
        const QuranAyah(
          ref: AyahRef(surah: 1, ayah: 2),
          textUthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
        ),
        const QuranAyah(
          ref: AyahRef(surah: 2, ayah: 1),
          textUthmani: 'الٓمٓ',
        ),
      ];

      final metadata = [
        const QuranPageMetadata(
          pageNumber: 1,
          juz: 1,
          hizb: 1,
          rub: 1,
          fromSurah: 1,
          fromAyah: 1,
          toSurah: 1,
          toAyah: 7,
        ),
        const QuranPageMetadata(
          pageNumber: 2,
          juz: 1,
          hizb: 1,
          rub: 1,
          fromSurah: 2,
          fromAyah: 1,
          toSurah: 2,
          toAyah: 5,
        ),
        ...List.generate(
          602,
          (index) => QuranPageMetadata(
            pageNumber: index + 3,
            juz: 1,
            hizb: 1,
            rub: 1,
            fromSurah: 114,
            fromAyah: 1,
            toSurah: 114,
            toAyah: 1,
          ),
        ),
      ];

      const builder = MushafPageBuilder();
      final pages = builder.buildPages(
        ayahs: ayahs,
        metadata: metadata,
      );

      expect(pages.length, 604);
      expect(pages.first.pageNumber, 1);
      expect(pages.first.ayahs.length, 2);
      expect(pages[1].ayahs.single.ref.surah, 2);
      expect(pages.first.metadata?.juz, 1);
    });
  });
}
