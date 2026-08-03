import '../../tasmee3/domain/quran_ayah.dart';
import '../domain/mushaf_page.dart';

/// Builds mushaf pages from Quran ayahs.
///
/// When page metadata is unavailable in the Quran asset, this uses an
/// approximate even split across [madinahPageCount] slots.
/// Do NOT claim these pages match Mushaf Al-Madinah unless licensed page
/// metadata is added.
class MushafPageBuilder {
  const MushafPageBuilder();

  static const int madinahPageCount = 604;

  List<MushafPage> buildPages(List<QuranAyah> ayahs) {
    if (ayahs.isEmpty) return const [];

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
