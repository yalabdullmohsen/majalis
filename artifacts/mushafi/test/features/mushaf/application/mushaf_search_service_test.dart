import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_search_service.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_search_filter.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_search_index_item.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('MushafSearchService', () {
    test('finds ayah without tashkeel', () async {
      const service = MushafSearchService();

      const ayah = QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      );

      final index = [
        MushafSearchIndexItem(
          ayah: ayah,
          pageNumber: 1,
          juz: 30,
          normalizedText: ArabicNormalizer.normalize(ayah.textUthmani),
          tokens: ArabicNormalizer.tokenize(ayah.textUthmani),
        ),
      ];

      final results = await service.searchIndex(
        index: index,
        query: 'الله احد',
        filter: const MushafSearchFilter.defaults(),
      );

      expect(results, isNotEmpty);
      expect(results.first.pageNumber, 1);
    });

    test('filters by juz', () async {
      const service = MushafSearchService();

      const ayah = QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      );

      final index = [
        MushafSearchIndexItem(
          ayah: ayah,
          pageNumber: 1,
          juz: 30,
          normalizedText: ArabicNormalizer.normalize(ayah.textUthmani),
          tokens: ArabicNormalizer.tokenize(ayah.textUthmani),
        ),
      ];

      final results = await service.searchIndex(
        index: index,
        query: 'الله',
        filter: const MushafSearchFilter(juz: 1),
      );

      expect(results, isEmpty);
    });

    test('filters by surah', () async {
      const service = MushafSearchService();

      const ayah = QuranAyah(
        ref: AyahRef(surah: 112, ayah: 1),
        textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      );

      final index = [
        MushafSearchIndexItem(
          ayah: ayah,
          pageNumber: 1,
          juz: 30,
          normalizedText: ArabicNormalizer.normalize(ayah.textUthmani),
          tokens: ArabicNormalizer.tokenize(ayah.textUthmani),
        ),
      ];

      final results = await service.searchIndex(
        index: index,
        query: 'الله',
        filter: const MushafSearchFilter(surah: 112),
      );

      expect(results, isNotEmpty);

      final filteredOut = await service.searchIndex(
        index: index,
        query: 'الله',
        filter: const MushafSearchFilter(surah: 1),
      );

      expect(filteredOut, isEmpty);
    });
  });
}
