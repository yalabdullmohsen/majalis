import '../domain/khatmah_reminder_settings.dart';

abstract class KhatmahReminderSettingsRepository {
  Future<KhatmahReminderSettings> load();

  Future<void> save(KhatmahReminderSettings settings);

  Future<void> reset();
}
