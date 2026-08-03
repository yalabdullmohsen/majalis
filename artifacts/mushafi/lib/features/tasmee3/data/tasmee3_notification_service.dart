import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../domain/tasmee3_daily_goal.dart';

class Tasmee3NotificationService {
  static const int dailyReminderId = 7311;

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

    final scheduledTime = _nextInstanceOfTime(goal.reminderTime);

    const androidDetails = AndroidNotificationDetails(
      'tasmee3_daily_reminder',
      'تذكير التسميع اليومي',
      channelDescription: 'تذكير يومي للمحافظة على التسميع',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    try {
      await _plugin.zonedSchedule(
        dailyReminderId,
        'تذكير التسميع',
        'لا تنس جلسة التسميع اليوم. جلسة قصيرة تكفي للاستمرار.',
        scheduledTime,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
    } catch (_) {
      await _plugin.zonedSchedule(
        dailyReminderId,
        'تذكير التسميع',
        'لا تنس جلسة التسميع اليوم. جلسة قصيرة تكفي للاستمرار.',
        scheduledTime,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
    }
  }

  Future<void> cancelDailyReminder() async {
    await initialize();
    await _plugin.cancel(dailyReminderId);
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

  tz.TZDateTime _nextInstanceOfTime(String time) {
    final parts = time.split(':');

    final hour = int.tryParse(parts.isNotEmpty ? parts[0] : '') ?? 20;
    final minute = int.tryParse(parts.length > 1 ? parts[1] : '') ?? 0;

    final now = tz.TZDateTime.now(tz.local);

    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour.clamp(0, 23),
      minute.clamp(0, 59),
    );

    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    return scheduled;
  }
}
