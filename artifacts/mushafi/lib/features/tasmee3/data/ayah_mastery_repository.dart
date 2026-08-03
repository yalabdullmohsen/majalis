import '../domain/ayah_mastery_record.dart';

abstract class AyahMasteryRepository {
  Future<List<AyahMasteryRecord>> loadAll();

  Future<void> saveAll(List<AyahMasteryRecord> records);

  Future<void> upsertMany(List<AyahMasteryRecord> records);

  Future<void> clear();
}
