import '../domain/quran_page_metadata.dart';

abstract class QuranPageMetadataRepository {
  Future<List<QuranPageMetadata>> loadAll();

  Future<QuranPageMetadata?> findPageForAyah({
    required int surah,
    required int ayah,
  });

  Future<QuranPageMetadata?> findPageByNumber(int pageNumber);
}
