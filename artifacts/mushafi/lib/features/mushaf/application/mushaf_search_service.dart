import '../../tasmee3/application/arabic_normalizer.dart';
import '../../tasmee3/domain/quran_ayah.dart';
import '../data/quran_page_metadata_repository.dart';
import '../domain/mushaf_search_result.dart';
import '../domain/quran_page_metadata.dart';
import 'mushaf_page_builder.dart';

class MushafSearchService {
  final QuranPageMetadataRepository pageMetadataRepository;

  const MushafSearchService({
    required this.pageMetadataRepository,
  });

  Future<List<MushafSearchResult>> search({
    required List<QuranAyah> ayahs,
    required String query,
    int limit = 80,
  }) async {
    final cleanedQuery = query.trim();

    if (cleanedQuery.isEmpty) {
      return const [];
    }

    final normalizedQuery = ArabicNormalizer.normalize(cleanedQuery);

    if (normalizedQuery.isEmpty) {
      return const [];
    }

    final queryTokens = ArabicNormalizer.tokenize(cleanedQuery);
    final metadata = await pageMetadataRepository.loadAll();
    final useLicensedMetadata =
        metadata.length == MushafPageBuilder.madinahPageCount;

    final results = <MushafSearchResult>[];

    for (var index = 0; index < ayahs.length; index++) {
      final ayah = ayahs[index];
      final normalizedAyah = ArabicNormalizer.normalize(ayah.textUthmani);

      final score = _score(
        normalizedAyah: normalizedAyah,
        normalizedQuery: normalizedQuery,
        queryTokens: queryTokens,
      );

      if (score <= 0) {
        continue;
      }

      final pageNumber = _resolvePageNumber(
        ayah: ayah,
        ayahIndex: index,
        totalAyahs: ayahs.length,
        metadata: metadata,
        useLicensedMetadata: useLicensedMetadata,
      );

      results.add(
        MushafSearchResult(
          ayah: ayah,
          pageNumber: pageNumber,
          query: cleanedQuery,
          normalizedQuery: normalizedQuery,
          snippet: _buildSnippet(
            originalText: ayah.textUthmani,
            normalizedAyah: normalizedAyah,
            normalizedQuery: normalizedQuery,
          ),
          score: score,
        ),
      );
    }

    results.sort((a, b) {
      final scoreCompare = b.score.compareTo(a.score);
      if (scoreCompare != 0) return scoreCompare;

      final surahCompare = a.ayah.ref.surah.compareTo(b.ayah.ref.surah);
      if (surahCompare != 0) return surahCompare;

      return a.ayah.ref.ayah.compareTo(b.ayah.ref.ayah);
    });

    return results.take(limit).toList();
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

  int _score({
    required String normalizedAyah,
    required String normalizedQuery,
    required List<String> queryTokens,
  }) {
    if (normalizedAyah == normalizedQuery) {
      return 1000;
    }

    if (normalizedAyah.contains(normalizedQuery)) {
      return 750;
    }

    var tokenMatches = 0;

    for (final token in queryTokens) {
      if (token.trim().isEmpty) continue;

      if (normalizedAyah.contains(token)) {
        tokenMatches++;
      }
    }

    if (tokenMatches == 0) {
      return 0;
    }

    return 100 + tokenMatches * 50;
  }

  String _buildSnippet({
    required String originalText,
    required String normalizedAyah,
    required String normalizedQuery,
  }) {
    // Keep the original Uthmani text; visual match highlighting can be added
    // later in the UI without mutating Quran text.
    return originalText;
  }
}
