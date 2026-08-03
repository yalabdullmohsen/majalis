import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/tasmee3_reminder.dart';
import 'tasmee3_reminder_repository.dart';

class LocalTasmee3ReminderRepository implements Tasmee3ReminderRepository {
  static const String _key = 'tasmee3_reminders_v1';

  @override
  Future<List<Tasmee3Reminder>> loadReminders() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw == null || raw.trim().isEmpty) {
      return _defaults();
    }

    final decoded = jsonDecode(raw) as List<dynamic>;

    return decoded
        .map((item) => Tasmee3Reminder.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> saveReminders(List<Tasmee3Reminder> reminders) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _key,
      jsonEncode(reminders.map((item) => item.toJson()).toList()),
    );
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  List<Tasmee3Reminder> _defaults() {
    return [
      Tasmee3Reminder.defaultDailyGoal(),
      Tasmee3Reminder.defaultStreakProtection(),
      Tasmee3Reminder.defaultWeakSpotsReview(),
      Tasmee3Reminder.defaultSmartTime(),
      Tasmee3Reminder.defaultRamadanWird(),
    ];
  }
}
