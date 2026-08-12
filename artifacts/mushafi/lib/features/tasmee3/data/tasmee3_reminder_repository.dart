import '../domain/tasmee3_reminder.dart';

abstract class Tasmee3ReminderRepository {
  Future<List<Tasmee3Reminder>> loadReminders();

  Future<void> saveReminders(List<Tasmee3Reminder> reminders);

  Future<void> clear();
}
