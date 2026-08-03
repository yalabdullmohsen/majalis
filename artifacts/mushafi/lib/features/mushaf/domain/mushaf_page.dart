import '../../tasmee3/domain/quran_ayah.dart';
import 'quran_page_metadata.dart';

class MushafPage {
  final int pageNumber;
  final int juz;
  final int hizb;
  final List<QuranAyah> ayahs;
  final QuranPageMetadata? metadata;

  const MushafPage({
    required this.pageNumber,
    required this.juz,
    required this.hizb,
    required this.ayahs,
    this.metadata,
  });

  bool get isEmpty => ayahs.isEmpty;

  int? get firstSurah => ayahs.isEmpty ? null : ayahs.first.ref.surah;
  int? get lastSurah => ayahs.isEmpty ? null : ayahs.last.ref.surah;
}
