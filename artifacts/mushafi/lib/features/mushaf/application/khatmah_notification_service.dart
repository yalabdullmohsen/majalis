import '../../tasmee3/data/tasmee3_notification_service.dart';
import '../domain/khatmah_plan.dart';
import '../domain/khatmah_reminder_settings.dart';

/// Local-only khatmah reminders via [Tasmee3NotificationService].
///
/// Notification bodies never include Quran text.
class KhatmahNotificationService {
  final Tasmee3NotificationService localNotifications;

  const KhatmahNotificationService({
    required this.localNotifications,
  });

  static const int dailyReminderId = 4801;
  static const int lateReminderId = 4802;

  Future<void> scheduleDailyReminder({
    required KhatmahPlan plan,
    required KhatmahReminderSettings settings,
  }) async {
    if (!settings.enabled) {
      await cancelDailyReminder();
      return;
    }

    await localNotifications.scheduleDailyLocalNotification(
      notificationId: dailyReminderId,
      title: 'ورد الختمة اليوم',
      body:
          'وردك اليوم ${plan.dailyPagesTarget} صفحة. تابع من صفحة ${plan.currentPage}.',
      hour: settings.hour,
      minute: settings.minute,
    );
  }

  Future<void> scheduleLateReminder({
    required KhatmahPlan plan,
    required KhatmahReminderSettings settings,
  }) async {
    if (!settings.lateReminderEnabled || !plan.isLate) {
      await cancelLateReminder();
      return;
    }

    await localNotifications.scheduleDailyLocalNotification(
      notificationId: lateReminderId,
      title: 'تذكير بالختمة',
      body: 'أنت متأخر ${plan.lateByPages} صفحة عن خطة الختمة.',
      hour: settings.lateReminderHour,
      minute: settings.lateReminderMinute,
    );
  }

  Future<void> cancelDailyReminder() async {
    await localNotifications.cancelById(dailyReminderId);
  }

  Future<void> cancelLateReminder() async {
    await localNotifications.cancelById(lateReminderId);
  }

  Future<void> cancelAll() async {
    await cancelDailyReminder();
    await cancelLateReminder();
  }
}
