import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/mushaf_search_service.dart';
import 'package:mushafi/features/mushaf/data/quran_page_metadata_repository.dart';
import 'package:mushafi/features/mushaf/domain/quran_page_metadata.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

class FakeMetadataRepository implements QuranPageMetadataRepository {
  @override
  Future<List<QuranPageMetadata>> loadAll() async {
    return const [
      QuranPageMetadata(
        pageNumber: 1,
        juz: 1,
        hizb: 1,
        rub: 1,
        fromSurah: 112,
        fromAyah: 1,
        toSurah: 112,
        toAyah: 4,
      ),
    ];
  }

  @override
  Future<QuranPageMetadata?> findPageByNumber(int pageNumber) async {
    return (await loadAll()).first;
  }

  @override
  Future<QuranPageMetadata?> findPageForAyah({
    required int surah,
    required int ayah,
  }) async {
    return (await loadAll()).first;
  }
}

void main() {
  group('MushafSearchService', () {
    test('finds ayah without tashkeel', () async {
      final service = MushafSearchService(
        pageMetadataRepository: FakeMetadataRepository(),
      );

      const ayahs = [
        QuranAyah(
          ref: AyahRef(surah: 112, ayah: 1),
          textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
        ),
      ];

      final results = await service.search(
        ayahs: ayahs,
        query: 'الله احد',
      );

      expect(results, isNotEmpty);
      expect(results.first.ayah.ref.surah, 112);
      expect(results.first.ayah.ref.ayah, 1);
    });

    test('returns empty for empty query', () async {
      final service = MushafSearchService(
        pageMetadataRepository: FakeMetadataRepository(),
      );

      final results = await service.search(
        ayahs: const [],
        query: '',
      );

      expect(results, isEmpty);
    });
  });
}
