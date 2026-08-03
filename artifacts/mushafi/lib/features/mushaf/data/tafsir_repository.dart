import '../domain/tafsir_entry.dart';
import '../domain/tafsir_source.dart';

abstract class TafsirRepository {
  Future<TafsirEntry?> getTafsir({
    required TafsirSource source,
    required int surah,
    required int ayah,
  });

  Future<List<TafsirEntry>> getAllEntries(TafsirSource source);
}
