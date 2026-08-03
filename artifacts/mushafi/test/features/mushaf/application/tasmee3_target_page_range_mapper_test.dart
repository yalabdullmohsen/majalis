import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/application/tasmee3_target_page_range_mapper.dart';
import 'package:mushafi/features/mushaf/data/quran_page_metadata_repository.dart';
import 'package:mushafi/features/mushaf/domain/quran_page_metadata.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';

class FakeMetadataRepository implements QuranPageMetadataRepository {
  @override
  Future<List<QuranPageMetadata>> loadAll() async {
    return const [
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
  }

  @override
  Future<QuranPageMetadata?> findPageByNumber(int pageNumber) async {
    for (final item in await loadAll()) {
      if (item.pageNumber == pageNumber) return item;
    }
    return null;
  }

  @override
  Future<QuranPageMetadata?> findPageForAyah({
    required int surah,
    required int ayah,
  }) async {
    for (final page in await loadAll()) {
      if (page.containsAyah(surah: surah, ayah: ayah)) {
        return page;
      }
    }

    return null;
  }
}

void main() {
  group('Tasmee3TargetPageRangeMapper', () {
    test('maps target to page range', () async {
      final mapper = Tasmee3TargetPageRangeMapper(
        metadataRepository: FakeMetadataRepository(),
      );

      const target = RecitationTarget(
        from: AyahRef(surah: 1, ayah: 1),
        to: AyahRef(surah: 2, ayah: 5),
        mode: Tasmee3Mode.hifzTest,
      );

      final range = await mapper.mapTargetToPageRange(target);

      expect(range, isNotNull);
      expect(range!.fromPage, 1);
      expect(range.toPage, 2);
    });
  });
}
