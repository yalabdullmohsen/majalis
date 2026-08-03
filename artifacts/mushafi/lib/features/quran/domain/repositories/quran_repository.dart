import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/quran_page.dart';
import 'package:mushafi/features/quran/domain/entities/surah.dart';

abstract class QuranRepository {
  Future<void> initialize();
  bool get isCompleteMushaf;
  bool get isMockSample;
  int get pageCount;
  List<Surah> get surahs;
  Future<QuranPage> getPage(int pageNumber);
  Future<Ayah?> getAyah(int surahId, int ayahNumber);
  Future<List<Ayah>> search(String query, {int limit = 50});
  Future<int> pageForSurahAyah(int surahId, int ayahNumber);
  IntegrityReport get lastIntegrityReport;
}

class IntegrityReport {
  const IntegrityReport({
    required this.ok,
    required this.surahCount,
    required this.ayahCount,
    required this.issues,
    required this.isMock,
  });
  final bool ok;
  final int surahCount;
  final int ayahCount;
  final List<String> issues;
  final bool isMock;
}
