class KhatmahReminderSettings {
  final bool enabled;
  final int hour;
  final int minute;
  final bool lateReminderEnabled;
  final int lateReminderHour;
  final int lateReminderMinute;

  const KhatmahReminderSettings({
    required this.enabled,
    required this.hour,
    required this.minute,
    required this.lateReminderEnabled,
    required this.lateReminderHour,
    required this.lateReminderMinute,
  });

  const KhatmahReminderSettings.defaults()
      : enabled = false,
        hour = 20,
        minute = 0,
        lateReminderEnabled = false,
        lateReminderHour = 21,
        lateReminderMinute = 0;

  String get timeLabel {
    final h = hour.toString().padLeft(2, '0');
    final m = minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String get lateTimeLabel {
    final h = lateReminderHour.toString().padLeft(2, '0');
    final m = lateReminderMinute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  KhatmahReminderSettings copyWith({
    bool? enabled,
    int? hour,
    int? minute,
    bool? lateReminderEnabled,
    int? lateReminderHour,
    int? lateReminderMinute,
  }) {
    return KhatmahReminderSettings(
      enabled: enabled ?? this.enabled,
      hour: hour ?? this.hour,
      minute: minute ?? this.minute,
      lateReminderEnabled: lateReminderEnabled ?? this.lateReminderEnabled,
      lateReminderHour: lateReminderHour ?? this.lateReminderHour,
      lateReminderMinute: lateReminderMinute ?? this.lateReminderMinute,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'hour': hour,
      'minute': minute,
      'lateReminderEnabled': lateReminderEnabled,
      'lateReminderHour': lateReminderHour,
      'lateReminderMinute': lateReminderMinute,
    };
  }

  factory KhatmahReminderSettings.fromJson(Map<String, dynamic> json) {
    return KhatmahReminderSettings(
      enabled: json['enabled'] as bool? ?? false,
      hour: json['hour'] as int? ?? 20,
      minute: json['minute'] as int? ?? 0,
      lateReminderEnabled: json['lateReminderEnabled'] as bool? ?? false,
      lateReminderHour: json['lateReminderHour'] as int? ?? 21,
      lateReminderMinute: json['lateReminderMinute'] as int? ?? 0,
    );
  }
}
