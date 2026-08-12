import '../../tasmee3/domain/quran_ayah.dart';

class MushafSearchIndexItem {
  final QuranAyah ayah;
  final int pageNumber;
  final int juz;
  final String normalizedText;
  final List<String> tokens;

  const MushafSearchIndexItem({
    required this.ayah,
    required this.pageNumber,
    required this.juz,
    required this.normalizedText,
    required this.tokens,
  });
}
