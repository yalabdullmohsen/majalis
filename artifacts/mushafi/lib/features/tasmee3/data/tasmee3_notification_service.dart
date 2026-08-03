import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_reminder.dart';
import '../domain/tasmee3_reminder_type.dart';

class Tasmee3NotificationService {
  static const int dailyReminderId = 7311;
  static const int baseReminderId = 7400;

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    tz_data.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(settings);

    _initialized = true;
  }

  Future<bool> requestPermission() async {
    await initialize();

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.requestNotificationsPermission();
    }

    final iosPlugin = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    if (iosPlugin != null) {
      await iosPlugin.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    final status = await Permission.notification.request();
    return status.isGranted || status.isLimited;
  }

  Future<void> scheduleDailyReminder(Tasmee3DailyGoal goal) async {
    await initialize();

    if (!goal.enabled || !goal.reminderEnabled) {
      await cancelDailyReminder();
      return;
    }

    final permission = await requestPermission();

    if (!permission) {
      return;
    }

    final reminder = Tasmee3Reminder(
      id: 'legacy_daily_goal',
      type: Tasmee3ReminderType.dailyGoal,
      title: 'تذكير التسميع',
      body: 'لا تنس جلسة التسميع اليوم. جلسة قصيرة تكفي للاستمرار.',
      time: goal.reminderTime,
      enabled: true,
      weekdays: const [1, 2, 3, 4, 5, 6, 7],
      createdAt: DateTime.now(),
    );

    await scheduleReminder(reminder, notificationId: dailyReminderId);
  }

  Future<void> scheduleAll(List<Tasmee3Reminder> reminders) async {
    await initialize();

    final permission = await requestPermission();

    if (!permission) {
      return;
    }

    await cancelManagedReminders();

    for (int i = 0; i < reminders.length; i++) {
      final reminder = reminders[i];

      if (!reminder.enabled) {
        continue;
      }

      await scheduleReminder(
        reminder,
        notificationId: baseReminderId + i,
      );
    }
  }

  Future<void> scheduleReminder(
    Tasmee3Reminder reminder, {
    required int notificationId,
  }) async {
    await initialize();

    if (!reminder.enabled) {
      await _plugin.cancel(notificationId);
      return;
    }

    final scheduledTime = _nextInstanceOfTime(
      reminder.time,
      reminder.weekdays,
    );

    const androidDetails = AndroidNotificationDetails(
      'tasmee3_reminders',
      'تذكيرات التسميع',
      channelDescription: 'تذكيرات التسميع والمراجعة',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final matchComponents = reminder.weekdays.length == 7
        ? DateTimeComponents.time
        : DateTimeComponents.dayOfWeekAndTime;

    try {
      await _plugin.zonedSchedule(
        notificationId,
        reminder.title,
        reminder.body,
        scheduledTime,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: matchComponents,
      );
    } catch (_) {
      await _plugin.zonedSchedule(
        notificationId,
        reminder.title,
        reminder.body,
        scheduledTime,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: matchComponents,
      );
    }
  }

  Future<void> cancelDailyReminder() async {
    await initialize();
    await _plugin.cancel(dailyReminderId);
  }

  Future<void> cancelManagedReminders() async {
    await initialize();

    for (int i = 0; i < 20; i++) {
      await _plugin.cancel(baseReminderId + i);
    }
  }

  Future<void> showTestNotification() async {
    await initialize();

    const androidDetails = AndroidNotificationDetails(
      'tasmee3_test',
      'اختبار إشعارات التسميع',
      channelDescription: 'إشعار تجريبي للتأكد من عمل التذكيرات',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(
      9911,
      'اختبار تنبيه التسميع',
      'الإشعارات تعمل بنجاح.',
      details,
    );
  }

  tz.TZDateTime _nextInstanceOfTime(
    String time,
    List<int> weekdays,
  ) {
    final parts = time.split(':');

    final hour = int.tryParse(parts.isNotEmpty ? parts[0] : '') ?? 20;
    final minute = int.tryParse(parts.length > 1 ? parts[1] : '') ?? 0;

    final now = tz.TZDateTime.now(tz.local);

    for (int dayOffset = 0; dayOffset < 14; dayOffset++) {
      final candidateDay = now.add(Duration(days: dayOffset));

      final weekday = candidateDay.weekday;

      if (weekdays.isNotEmpty && !weekdays.contains(weekday)) {
        continue;
      }

      final scheduled = tz.TZDateTime(
        tz.local,
        candidateDay.year,
        candidateDay.month,
        candidateDay.day,
        hour.clamp(0, 23),
        minute.clamp(0, 59),
      );

      if (scheduled.isAfter(now)) {
        return scheduled;
      }
    }

    return tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour.clamp(0, 23),
      minute.clamp(0, 59),
    ).add(const Duration(days: 1));
  }
}
