import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_search_suggestions_service.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_search_index_item.dart';
import 'package:mushafi/features/tasmee3/application/arabic_normalizer.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('MushafSearchSuggestionsService', () {
    test('builds suggestions from indexed tokens', () {
      const service = MushafSearchSuggestionsService();

      const ayah = QuranAyah(
        ref: AyahRef(surah: 1, ayah: 1),
        textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      );

      final suggestions = service.buildSuggestions(
        [
          MushafSearchIndexItem(
            ayah: ayah,
            pageNumber: 1,
            juz: 1,
            normalizedText: ArabicNormalizer.normalize(ayah.textUthmani),
            tokens: ArabicNormalizer.tokenize(ayah.textUthmani),
          ),
        ],
      );

      expect(suggestions, isNotEmpty);
    });
  });
}
