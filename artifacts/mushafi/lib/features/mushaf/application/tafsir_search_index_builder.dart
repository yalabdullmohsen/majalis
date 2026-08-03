import '../../tasmee3/application/arabic_normalizer.dart';
import '../../tasmee3/data/quran_repository.dart';
import '../../tasmee3/domain/quran_ayah.dart';
import '../data/quran_page_metadata_repository.dart';
import '../data/tafsir_repository.dart';
import '../domain/quran_page_metadata.dart';
import '../domain/tafsir_search_index_item.dart';
import '../domain/tafsir_source.dart';
import 'mushaf_page_builder.dart';

class TafsirSearchIndexBuilder {
  final QuranRepository quranRepository;
  final TafsirRepository tafsirRepository;
  final QuranPageMetadataRepository pageMetadataRepository;

  const TafsirSearchIndexBuilder({
    required this.quranRepository,
    required this.tafsirRepository,
    required this.pageMetadataRepository,
  });

  Future<List<TafsirSearchIndexItem>> build(TafsirSource source) async {
    final ayahs = await quranRepository.getAllAyahs();
    final entries = await tafsirRepository.getAllEntries(source);

    if (entries.isEmpty) {
      return const [];
    }

    final ayahMap = {
      for (final ayah in ayahs) ayah.ref.key: ayah,
    };
    final ayahIndexByKey = <String, int>{
      for (var i = 0; i < ayahs.length; i++) ayahs[i].ref.key: i,
    };

    final metadata = await pageMetadataRepository.loadAll();
    final useLicensedMetadata =
        metadata.length == MushafPageBuilder.madinahPageCount;

    final items = <TafsirSearchIndexItem>[];

    for (final entry in entries) {
      final key = '${entry.surah}:${entry.ayah}';
      final ayah = ayahMap[key];

      if (ayah == null) {
        continue;
      }

      final text = entry.text.trim();

      if (text.isEmpty) {
        continue;
      }

      final ayahIndex = ayahIndexByKey[key] ?? 0;
      final pageNumber = _resolvePageNumber(
        ayah: ayah,
        ayahIndex: ayahIndex,
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

      items.add(
        TafsirSearchIndexItem(
          ayah: ayah,
          tafsir: entry,
          source: source,
          pageNumber: pageNumber,
          juz: juz,
          normalizedTafsir: ArabicNormalizer.normalize(text),
          tokens: ArabicNormalizer.tokenize(text),
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

    return (((pageNumber - 1) / 20).floor() + 1).clamp(1, 30);
  }
}
