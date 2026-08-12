import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/tasmee3_daily_goal.dart';
import 'tasmee3_goal_repository.dart';

class LocalTasmee3GoalRepository implements Tasmee3GoalRepository {
  static const String _key = 'tasmee3_daily_goal';

  @override
  Future<Tasmee3DailyGoal> loadGoal() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return const Tasmee3DailyGoal.defaults();
    }

    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return Tasmee3DailyGoal.fromJson(decoded);
  }

  @override
  Future<void> saveGoal(Tasmee3DailyGoal goal) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(goal.toJson()));
  }

  @override
  Future<void> clearGoal() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
