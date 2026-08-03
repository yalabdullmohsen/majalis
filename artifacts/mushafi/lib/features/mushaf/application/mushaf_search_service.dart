import '../../tasmee3/application/arabic_normalizer.dart';
import '../domain/mushaf_search_filter.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/mushaf_search_result.dart';

class MushafSearchService {
  const MushafSearchService();

  Future<List<MushafSearchResult>> searchIndex({
    required List<MushafSearchIndexItem> index,
    required String query,
    required MushafSearchFilter filter,
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

    final results = <MushafSearchResult>[];

    // TODO: Add tafsir search when licensed tafsir assets are available
    // and indexed without affecting Quran text integrity.

    if (!filter.includeQuranText) {
      return const [];
    }

    for (final item in index) {
      if (filter.surah != null && item.ayah.ref.surah != filter.surah) {
        continue;
      }

      if (filter.juz != null && item.juz != filter.juz) {
        continue;
      }

      final score = _score(
        normalizedAyah: item.normalizedText,
        normalizedQuery: normalizedQuery,
        queryTokens: queryTokens,
        ayahTokens: item.tokens,
      );

      if (score <= 0) {
        continue;
      }

      results.add(
        MushafSearchResult(
          ayah: item.ayah,
          pageNumber: item.pageNumber,
          query: cleanedQuery,
          normalizedQuery: normalizedQuery,
          snippet: item.ayah.textUthmani,
          score: score,
          source: MushafSearchResultSource.quranText,
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

    return results.take(filter.limit).toList();
  }

  int _score({
    required String normalizedAyah,
    required String normalizedQuery,
    required List<String> queryTokens,
    required List<String> ayahTokens,
  }) {
    if (normalizedAyah == normalizedQuery) {
      return 1000;
    }

    if (normalizedAyah.contains(normalizedQuery)) {
      return 800;
    }

    var tokenMatches = 0;
    var exactTokenMatches = 0;

    for (final token in queryTokens) {
      if (token.trim().isEmpty) continue;

      if (ayahTokens.contains(token)) {
        exactTokenMatches++;
      } else if (normalizedAyah.contains(token)) {
        tokenMatches++;
      }
    }

    if (exactTokenMatches == 0 && tokenMatches == 0) {
      return 0;
    }

    return 150 + exactTokenMatches * 90 + tokenMatches * 45;
  }
}
