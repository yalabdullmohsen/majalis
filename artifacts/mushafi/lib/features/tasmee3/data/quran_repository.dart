import '../domain/quran_ayah.dart';
import '../domain/recitation_target.dart';

abstract class QuranRepository {
  Future<List<QuranAyah>> getAyahsInTarget(RecitationTarget target);

  Future<List<QuranAyah>> getAllAyahs();
}
