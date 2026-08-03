import '../data/khatmah_reminder_settings_repository.dart';
import '../domain/khatmah_plan.dart';
import 'khatmah_notification_service.dart';

class KhatmahReminderCoordinator {
  final KhatmahReminderSettingsRepository settingsRepository;
  final KhatmahNotificationService notificationService;

  const KhatmahReminderCoordinator({
    required this.settingsRepository,
    required this.notificationService,
  });

  Future<void> rescheduleForPlan(KhatmahPlan? plan) async {
    final settings = await settingsRepository.load();

    if (plan == null) {
      await notificationService.cancelAll();
      return;
    }

    await notificationService.scheduleDailyReminder(
      plan: plan,
      settings: settings,
    );

    await notificationService.scheduleLateReminder(
      plan: plan,
      settings: settings,
    );
  }
}
