import '../../tasmee3/application/arabic_normalizer.dart';
import '../domain/mushaf_search_filter.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/mushaf_search_result.dart';
import '../domain/tafsir_search_index_item.dart';

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
        normalizedText: item.normalizedText,
        normalizedQuery: normalizedQuery,
        queryTokens: queryTokens,
        tokens: item.tokens,
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

    results.sort(_compareResults);

    return results.take(filter.limit).toList();
  }

  Future<List<MushafSearchResult>> searchTafsirIndex({
    required List<TafsirSearchIndexItem> index,
    required String query,
    required MushafSearchFilter filter,
  }) async {
    final cleanedQuery = query.trim();

    if (cleanedQuery.isEmpty || index.isEmpty) {
      return const [];
    }

    final normalizedQuery = ArabicNormalizer.normalize(cleanedQuery);

    if (normalizedQuery.isEmpty) {
      return const [];
    }

    final queryTokens = ArabicNormalizer.tokenize(cleanedQuery);

    final results = <MushafSearchResult>[];

    for (final item in index) {
      if (filter.surah != null && item.ayah.ref.surah != filter.surah) {
        continue;
      }

      if (filter.juz != null && item.juz != filter.juz) {
        continue;
      }

      final score = _score(
        normalizedText: item.normalizedTafsir,
        normalizedQuery: normalizedQuery,
        queryTokens: queryTokens,
        tokens: item.tokens,
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
          tafsirSnippet: item.tafsir.text,
          score: score,
          source: MushafSearchResultSource.tafsir,
          tafsirSourceName: item.source.nameArabic,
        ),
      );
    }

    results.sort(_compareResults);

    return results.take(filter.limit).toList();
  }

  Future<List<MushafSearchResult>> searchCombined({
    required List<MushafSearchIndexItem> quranIndex,
    required List<TafsirSearchIndexItem> tafsirIndex,
    required String query,
    required MushafSearchFilter filter,
  }) async {
    final results = <MushafSearchResult>[];

    if (filter.includeQuranText) {
      final quranResults = await searchIndex(
        index: quranIndex,
        query: query,
        filter: filter,
      );

      results.addAll(quranResults);
    }

    if (filter.includeTafsir && tafsirIndex.isNotEmpty) {
      final tafsirResults = await searchTafsirIndex(
        index: tafsirIndex,
        query: query,
        filter: filter,
      );

      results.addAll(tafsirResults);
    }

    results.sort((a, b) {
      final scoreCompare = b.score.compareTo(a.score);
      if (scoreCompare != 0) return scoreCompare;

      final sourceCompare = a.source.index.compareTo(b.source.index);
      if (sourceCompare != 0) return sourceCompare;

      final surahCompare = a.ayah.ref.surah.compareTo(b.ayah.ref.surah);
      if (surahCompare != 0) return surahCompare;

      return a.ayah.ref.ayah.compareTo(b.ayah.ref.ayah);
    });

    return results.take(filter.limit).toList();
  }

  int _compareResults(MushafSearchResult a, MushafSearchResult b) {
    final scoreCompare = b.score.compareTo(a.score);
    if (scoreCompare != 0) return scoreCompare;

    final surahCompare = a.ayah.ref.surah.compareTo(b.ayah.ref.surah);
    if (surahCompare != 0) return surahCompare;

    return a.ayah.ref.ayah.compareTo(b.ayah.ref.ayah);
  }

  int _score({
    required String normalizedText,
    required String normalizedQuery,
    required List<String> queryTokens,
    required List<String> tokens,
  }) {
    if (normalizedText == normalizedQuery) {
      return 1000;
    }

    if (normalizedText.contains(normalizedQuery)) {
      return 800;
    }

    var tokenMatches = 0;
    var exactTokenMatches = 0;

    for (final token in queryTokens) {
      if (token.trim().isEmpty) continue;

      if (tokens.contains(token)) {
        exactTokenMatches++;
      } else if (normalizedText.contains(token)) {
        tokenMatches++;
      }
    }

    if (exactTokenMatches == 0 && tokenMatches == 0) {
      return 0;
    }

    return 150 + exactTokenMatches * 90 + tokenMatches * 45;
  }
}
