import '../domain/mushaf_ayah_review_marker.dart';

abstract class MushafReviewMarkerRepository {
  Future<List<MushafAyahReviewMarker>> getAll();

  Future<List<MushafAyahReviewMarker>> getByAyah({
    required int surah,
    required int ayah,
  });

  Future<void> saveAll(List<MushafAyahReviewMarker> markers);

  Future<void> removeForAyah({
    required int surah,
    required int ayah,
  });

  Future<void> clearAll();
}
