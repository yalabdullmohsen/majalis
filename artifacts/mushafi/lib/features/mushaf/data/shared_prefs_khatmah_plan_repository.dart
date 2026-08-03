import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/khatmah_plan.dart';
import '../domain/khatmah_plan_status.dart';
import '../domain/khatmah_reading_log.dart';
import 'khatmah_plan_repository.dart';

class SharedPrefsKhatmahPlanRepository implements KhatmahPlanRepository {
  static const String _plansKey = 'mushaf_khatmah_plans_v1';
  static const String _logsKey = 'mushaf_khatmah_logs_v1';

  @override
  Future<List<KhatmahPlan>> getPlans() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_plansKey);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    final plans = decoded
        .map((item) => KhatmahPlan.fromJson(item as Map<String, dynamic>))
        .toList();

    plans.sort((a, b) => b.startedAt.compareTo(a.startedAt));

    return plans;
  }

  @override
  Future<KhatmahPlan?> getActivePlan() async {
    final plans = await getPlans();

    for (final plan in plans) {
      if (plan.status == KhatmahPlanStatus.active) {
        return plan;
      }
    }

    return null;
  }

  @override
  Future<void> savePlan(KhatmahPlan plan) async {
    final plans = await getPlans();

    final updated = [
      plan,
      ...plans.where((item) => item.id != plan.id),
    ];

    await _savePlans(updated);
  }

  @override
  Future<void> deletePlan(String id) async {
    final plans = await getPlans();
    final updated = plans.where((item) => item.id != id).toList();

    await _savePlans(updated);
  }

  @override
  Future<List<KhatmahReadingLog>> getLogs() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_logsKey);

    if (raw == null || raw.trim().isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    final logs = decoded
        .map((item) => KhatmahReadingLog.fromJson(item as Map<String, dynamic>))
        .toList();

    logs.sort((a, b) => b.readAt.compareTo(a.readAt));

    return logs;
  }

  @override
  Future<void> addLog(KhatmahReadingLog log) async {
    final logs = await getLogs();
    final updated = [log, ...logs];

    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _logsKey,
      jsonEncode(updated.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_plansKey);
    await prefs.remove(_logsKey);
  }

  Future<void> _savePlans(List<KhatmahPlan> plans) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _plansKey,
      jsonEncode(plans.map((item) => item.toJson()).toList()),
    );
  }
}
