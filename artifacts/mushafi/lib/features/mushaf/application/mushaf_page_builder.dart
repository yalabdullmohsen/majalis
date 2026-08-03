import '../../tasmee3/domain/quran_ayah.dart';
import '../domain/mushaf_page.dart';
import '../domain/quran_page_metadata.dart';

/// Builds mushaf pages from Quran ayahs and optional page metadata.
///
/// When [metadata] is empty, falls back to an approximate even split.
/// Do NOT claim pages match Mushaf Al-Madinah unless licensed full metadata
/// (604 pages) is provided.
class MushafPageBuilder {
  const MushafPageBuilder();

  static const int madinahPageCount = 604;

  List<MushafPage> buildPages({
    required List<QuranAyah> ayahs,
    required List<QuranPageMetadata> metadata,
  }) {
    if (ayahs.isEmpty) return const [];

    // Incomplete placeholder metadata must not hide most of the Quran.
    // Only use licensed full Madinah-style metadata when all 604 pages exist.
    if (metadata.isEmpty || metadata.length < madinahPageCount) {
      return _buildApproximatePages(ayahs);
    }

    final pages = <MushafPage>[];

    for (final pageMeta in metadata) {
      final pageAyahs = ayahs.where((ayah) {
        return pageMeta.containsAyah(
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        );
      }).toList();

      pages.add(
        MushafPage(
          pageNumber: pageMeta.pageNumber,
          juz: pageMeta.juz,
          hizb: pageMeta.hizb,
          ayahs: pageAyahs,
          metadata: pageMeta,
        ),
      );
    }

    pages.sort((a, b) => a.pageNumber.compareTo(b.pageNumber));

    return pages;
  }

  List<MushafPage> _buildApproximatePages(List<QuranAyah> ayahs) {
    final pages = <MushafPage>[];
    final total = ayahs.length;

    for (var page = 1; page <= madinahPageCount; page++) {
      final start = ((page - 1) * total / madinahPageCount).floor();
      final end = (page * total / madinahPageCount).floor();

      final pageAyahs =
          start < end ? ayahs.sublist(start, end) : const <QuranAyah>[];

      pages.add(
        MushafPage(
          pageNumber: page,
          juz: 0,
          hizb: 0,
          ayahs: pageAyahs,
        ),
      );
    }

    return pages;
  }
}
