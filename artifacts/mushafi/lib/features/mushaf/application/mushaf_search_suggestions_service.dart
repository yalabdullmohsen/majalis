import '../../tasmee3/application/arabic_normalizer.dart';
import '../domain/mushaf_search_index_item.dart';

class MushafSearchSuggestionsService {
  const MushafSearchSuggestionsService();

  List<String> buildSuggestions(List<MushafSearchIndexItem> index) {
    final counts = <String, int>{};

    for (final item in index) {
      for (final token in item.tokens) {
        if (token.length < 3) continue;

        counts[token] = (counts[token] ?? 0) + 1;
      }
    }

    final entries = counts.entries.toList();

    entries.sort((a, b) => b.value.compareTo(a.value));

    return entries
        .take(30)
        .map((entry) => entry.key)
        .where((word) => ArabicNormalizer.normalize(word).isNotEmpty)
        .toList();
  }
}
