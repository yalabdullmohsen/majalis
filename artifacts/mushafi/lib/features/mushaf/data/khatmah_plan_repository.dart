import '../domain/khatmah_plan.dart';
import '../domain/khatmah_reading_log.dart';

abstract class KhatmahPlanRepository {
  Future<List<KhatmahPlan>> getPlans();

  Future<KhatmahPlan?> getActivePlan();

  Future<void> savePlan(KhatmahPlan plan);

  Future<void> deletePlan(String id);

  Future<List<KhatmahReadingLog>> getLogs();

  Future<void> addLog(KhatmahReadingLog log);

  Future<void> clearAll();
}
