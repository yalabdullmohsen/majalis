import '../../tasmee3/application/arabic_normalizer.dart';
import '../../tasmee3/domain/quran_ayah.dart';
import '../data/quran_page_metadata_repository.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/quran_page_metadata.dart';
import 'mushaf_page_builder.dart';

class MushafSearchIndexBuilder {
  final QuranPageMetadataRepository pageMetadataRepository;

  const MushafSearchIndexBuilder({
    required this.pageMetadataRepository,
  });

  Future<List<MushafSearchIndexItem>> build(List<QuranAyah> ayahs) async {
    final metadata = await pageMetadataRepository.loadAll();
    final useLicensedMetadata =
        metadata.length == MushafPageBuilder.madinahPageCount;

    final items = <MushafSearchIndexItem>[];

    for (var index = 0; index < ayahs.length; index++) {
      final ayah = ayahs[index];
      final pageNumber = _resolvePageNumber(
        ayah: ayah,
        ayahIndex: index,
        totalAyahs: ayahs.length,
        metadata: metadata,
        useLicensedMetadata: useLicensedMetadata,
      );
      final juz = _resolveJuz(
        ayah: ayah,
        pageNumber: pageNumber,
        metadata: metadata,
        useLicensedMetadata: useLicensedMetadata,
      );

      final normalizedText = ArabicNormalizer.normalize(ayah.textUthmani);
      final tokens = ArabicNormalizer.tokenize(ayah.textUthmani);

      items.add(
        MushafSearchIndexItem(
          ayah: ayah,
          pageNumber: pageNumber,
          juz: juz,
          normalizedText: normalizedText,
          tokens: tokens,
        ),
      );
    }

    return items;
  }

  int _resolvePageNumber({
    required QuranAyah ayah,
    required int ayahIndex,
    required int totalAyahs,
    required List<QuranPageMetadata> metadata,
    required bool useLicensedMetadata,
  }) {
    if (useLicensedMetadata) {
      for (final page in metadata) {
        if (page.containsAyah(
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        )) {
          return page.pageNumber;
        }
      }
    }

    if (totalAyahs <= 0) return 1;

    final page = ((ayahIndex * MushafPageBuilder.madinahPageCount) / totalAyahs)
            .floor() +
        1;

    return page.clamp(1, MushafPageBuilder.madinahPageCount);
  }

  int _resolveJuz({
    required QuranAyah ayah,
    required int pageNumber,
    required List<QuranPageMetadata> metadata,
    required bool useLicensedMetadata,
  }) {
    if (useLicensedMetadata) {
      for (final page in metadata) {
        if (page.containsAyah(
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        )) {
          return page.juz;
        }
      }
    }

    // Approximate juz from approximate page (Madinah ~20 pages/juz).
    return (((pageNumber - 1) / 20).floor() + 1).clamp(1, 30);
  }
}
