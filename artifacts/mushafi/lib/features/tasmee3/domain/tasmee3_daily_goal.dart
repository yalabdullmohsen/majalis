enum Tasmee3GoalType {
  sessions,
  minutes,
  ayahs,
}

extension Tasmee3GoalTypeLabel on Tasmee3GoalType {
  String get arabicLabel {
    switch (this) {
      case Tasmee3GoalType.sessions:
        return 'عدد الجلسات';
      case Tasmee3GoalType.minutes:
        return 'عدد الدقائق';
      case Tasmee3GoalType.ayahs:
        return 'عدد الآيات';
    }
  }
}

class Tasmee3DailyGoal {
  final Tasmee3GoalType type;
  final int targetValue;
  final bool enabled;
  final String reminderTime;
  final bool reminderEnabled;

  const Tasmee3DailyGoal({
    required this.type,
    required this.targetValue,
    required this.enabled,
    required this.reminderTime,
    required this.reminderEnabled,
  });

  const Tasmee3DailyGoal.defaults()
      : type = Tasmee3GoalType.sessions,
        targetValue = 1,
        enabled = true,
        reminderTime = '20:00',
        reminderEnabled = false;

  Tasmee3DailyGoal copyWith({
    Tasmee3GoalType? type,
    int? targetValue,
    bool? enabled,
    String? reminderTime,
    bool? reminderEnabled,
  }) {
    return Tasmee3DailyGoal(
      type: type ?? this.type,
      targetValue: targetValue ?? this.targetValue,
      enabled: enabled ?? this.enabled,
      reminderTime: reminderTime ?? this.reminderTime,
      reminderEnabled: reminderEnabled ?? this.reminderEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'targetValue': targetValue,
      'enabled': enabled,
      'reminderTime': reminderTime,
      'reminderEnabled': reminderEnabled,
    };
  }

  factory Tasmee3DailyGoal.fromJson(Map<String, dynamic> json) {
    final typeName = json['type'] as String?;

    final type = Tasmee3GoalType.values.firstWhere(
      (item) => item.name == typeName,
      orElse: () => Tasmee3GoalType.sessions,
    );

    return Tasmee3DailyGoal(
      type: type,
      targetValue: json['targetValue'] as int? ?? 1,
      enabled: json['enabled'] as bool? ?? true,
      reminderTime: json['reminderTime'] as String? ?? '20:00',
      reminderEnabled: json['reminderEnabled'] as bool? ?? false,
    );
  }
}
