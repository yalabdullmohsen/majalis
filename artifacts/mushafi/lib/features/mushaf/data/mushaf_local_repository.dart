import '../domain/mushaf_bookmark.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_note.dart';
import '../domain/mushaf_reading_position.dart';

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
}
