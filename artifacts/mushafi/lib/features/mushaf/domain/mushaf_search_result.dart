import '../../tasmee3/domain/quran_ayah.dart';

class MushafSearchResult {
  final QuranAyah ayah;
  final int pageNumber;
  final String query;
  final String normalizedQuery;
  final String snippet;
  final int score;

  const MushafSearchResult({
    required this.ayah,
    required this.pageNumber,
    required this.query,
    required this.normalizedQuery,
    required this.snippet,
    required this.score,
  });
}
