import 'tasmee3_reminder_type.dart';

class Tasmee3Reminder {
  final String id;
  final Tasmee3ReminderType type;
  final String title;
  final String body;
  final String time;
  final bool enabled;
  final List<int> weekdays;
  final DateTime createdAt;

  const Tasmee3Reminder({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    required this.enabled,
    required this.weekdays,
    required this.createdAt,
  });

  Tasmee3Reminder copyWith({
    String? id,
    Tasmee3ReminderType? type,
    String? title,
    String? body,
    String? time,
    bool? enabled,
    List<int>? weekdays,
    DateTime? createdAt,
  }) {
    return Tasmee3Reminder(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      time: time ?? this.time,
      enabled: enabled ?? this.enabled,
      weekdays: weekdays ?? this.weekdays,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'title': title,
      'body': body,
      'time': time,
      'enabled': enabled,
      'weekdays': weekdays,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Tasmee3Reminder.fromJson(Map<String, dynamic> json) {
    final typeName = json['type'] as String?;

    final type = Tasmee3ReminderType.values.firstWhere(
      (item) => item.name == typeName,
      orElse: () => Tasmee3ReminderType.dailyGoal,
    );

    final weekdaysRaw = json['weekdays'] as List<dynamic>? ?? const [];

    return Tasmee3Reminder(
      id: json['id'] as String,
      type: type,
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      time: json['time'] as String? ?? '20:00',
      enabled: json['enabled'] as bool? ?? true,
      weekdays: weekdaysRaw.map((e) => e as int).toList(),
      createdAt: DateTime.parse(
        json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  factory Tasmee3Reminder.defaultDailyGoal() {
    return Tasmee3Reminder(
      id: 'daily_goal',
      type: Tasmee3ReminderType.dailyGoal,
      title: 'تذكير التسميع',
      body: 'لا تنس جلسة التسميع اليوم. جلسة قصيرة تكفي للاستمرار.',
      time: '20:00',
      enabled: false,
      weekdays: const [1, 2, 3, 4, 5, 6, 7],
      createdAt: DateTime.now(),
    );
  }

  factory Tasmee3Reminder.defaultStreakProtection() {
    return Tasmee3Reminder(
      id: 'streak_protection',
      type: Tasmee3ReminderType.streakProtection,
      title: 'لا تقطع سلسلة التسميع',
      body:
          'بقي القليل على نهاية اليوم. أكمل جلسة قصيرة لتحافظ على الاستمرار.',
      time: '21:30',
      enabled: false,
      weekdays: const [1, 2, 3, 4, 5, 6, 7],
      createdAt: DateTime.now(),
    );
  }

  factory Tasmee3Reminder.defaultWeakSpotsReview() {
    return Tasmee3Reminder(
      id: 'weak_spots_review',
      type: Tasmee3ReminderType.weakSpotsReview,
      title: 'مراجعة مواضع الضعف',
      body: 'راجع الآيات التي ظهرت فيها أخطاء في جلساتك السابقة.',
      time: '18:00',
      enabled: false,
      weekdays: const [1, 3, 5],
      createdAt: DateTime.now(),
    );
  }

  factory Tasmee3Reminder.defaultSmartTime() {
    return Tasmee3Reminder(
      id: 'smart_time',
      type: Tasmee3ReminderType.smartTime,
      title: 'وقت مناسب للتسميع',
      body: 'هذا وقت قريب من وقت نشاطك السابق. هل تبدأ جلسة قصيرة؟',
      time: '20:00',
      enabled: false,
      weekdays: const [1, 2, 3, 4, 5, 6, 7],
      createdAt: DateTime.now(),
    );
  }

  factory Tasmee3Reminder.defaultRamadanWird() {
    return Tasmee3Reminder(
      id: 'ramadan_wird',
      type: Tasmee3ReminderType.ramadanWird,
      title: 'ورد التسميع',
      body: 'خصص دقائق قليلة لمراجعة وردك اليومي.',
      time: '16:00',
      enabled: false,
      weekdays: const [1, 2, 3, 4, 5, 6, 7],
      createdAt: DateTime.now(),
    );
  }
}
