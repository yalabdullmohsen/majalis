import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_search_service.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_search_filter.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_search_result.dart';
import 'package:mushafi/features/mushaf/domain/tafsir_entry.dart';
import 'package:mushafi/features/mushaf/domain/tafsir_search_index_item.dart';
import 'package:mushafi/features/mushaf/domain/tafsir_source.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('MushafSearchService tafsir search', () {
    test('finds tafsir result', () async {
      const service = MushafSearchService();

      const ayah = QuranAyah(
        ref: AyahRef(surah: 1, ayah: 1),
        textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      );

      const tafsir = TafsirEntry(
        surah: 1,
        ayah: 1,
        text: 'ابتدأ القرآن بذكر اسم الله الرحمن الرحيم.',
      );

      const source = TafsirSource(
        id: 'test',
        nameArabic: 'تفسير اختبار',
        assetPath: 'test',
      );

      final index = [
        TafsirSearchIndexItem(
          ayah: ayah,
          tafsir: tafsir,
          source: source,
          pageNumber: 1,
          juz: 1,
          normalizedTafsir: ArabicNormalizer.normalize(tafsir.text),
          tokens: ArabicNormalizer.tokenize(tafsir.text),
        ),
      ];

      final results = await service.searchTafsirIndex(
        index: index,
        query: 'الرحمن',
        filter: const MushafSearchFilter(
          includeQuranText: false,
          includeTafsir: true,
        ),
      );

      expect(results, isNotEmpty);
      expect(results.first.source, MushafSearchResultSource.tafsir);
      expect(results.first.tafsirSnippet, contains('الرحمن'));
    });

    test('returns empty when tafsir index is empty', () async {
      const service = MushafSearchService();

      final results = await service.searchTafsirIndex(
        index: const [],
        query: 'الرحمن',
        filter: const MushafSearchFilter(
          includeQuranText: false,
          includeTafsir: true,
        ),
      );

      expect(results, isEmpty);
    });
  });
}
