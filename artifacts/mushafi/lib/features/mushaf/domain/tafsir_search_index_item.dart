import '../../tasmee3/domain/quran_ayah.dart';
import 'tafsir_entry.dart';
import 'tafsir_source.dart';

class TafsirSearchIndexItem {
  final QuranAyah ayah;
  final TafsirEntry tafsir;
  final TafsirSource source;
  final int pageNumber;
  final int juz;
  final String normalizedTafsir;
  final List<String> tokens;

  const TafsirSearchIndexItem({
    required this.ayah,
    required this.tafsir,
    required this.source,
    required this.pageNumber,
    required this.juz,
    required this.normalizedTafsir,
    required this.tokens,
  });
}
