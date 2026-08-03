import '../../tasmee3/domain/quran_ayah.dart';

enum MushafSearchResultSource {
  quranText,
  tafsir,
}

class MushafSearchResult {
  final QuranAyah ayah;
  final int pageNumber;
  final String query;
  final String normalizedQuery;
  final String snippet;
  final int score;
  final MushafSearchResultSource source;
  final String? tafsirSourceName;

  const MushafSearchResult({
    required this.ayah,
    required this.pageNumber,
    required this.query,
    required this.normalizedQuery,
    required this.snippet,
    required this.score,
    this.source = MushafSearchResultSource.quranText,
    this.tafsirSourceName,
  });
}
