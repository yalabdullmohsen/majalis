import '../domain/khatmah_progress.dart';
import '../domain/mushaf_bookmark.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_note.dart';
import '../domain/mushaf_reading_position.dart';
import '../domain/mushaf_tasmee3_last_range.dart';

abstract class MushafLocalRepository {
  Future<MushafReadingPosition?> getLastPosition();
  Future<void> saveLastPosition(MushafReadingPosition position);

  Future<List<MushafBookmark>> getBookmarks();
  Future<void> saveBookmark(MushafBookmark bookmark);
  Future<void> removeBookmark(String id);

  Future<List<MushafFavoriteAyah>> getFavorites();
  Future<void> toggleFavorite(MushafFavoriteAyah favorite);

  Future<List<MushafNote>> getNotes();
  Future<void> saveNote(MushafNote note);
  Future<void> removeNote(String id);

  Future<KhatmahProgress> getKhatmahProgress();
  Future<void> saveKhatmahProgress(KhatmahProgress progress);
  Future<void> resetKhatmahProgress();

  Future<MushafTasmee3LastRange?> getLastTasmee3Range();
  Future<void> saveLastTasmee3Range(MushafTasmee3LastRange range);
}
