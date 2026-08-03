import 'tasmee3_daily_goal.dart';

class Tasmee3GoalProgress {
  final Tasmee3DailyGoal goal;
  final int currentValue;
  final int targetValue;

  const Tasmee3GoalProgress({
    required this.goal,
    required this.currentValue,
    required this.targetValue,
  });

  double get progress {
    if (targetValue <= 0) {
      return 0;
    }

    return (currentValue / targetValue).clamp(0, 1).toDouble();
  }

  int get progressPercent => (progress * 100).round();

  bool get completed => currentValue >= targetValue;

  String get title {
    switch (goal.type) {
      case Tasmee3GoalType.sessions:
        return 'هدف الجلسات اليومي';
      case Tasmee3GoalType.minutes:
        return 'هدف الدقائق اليومي';
      case Tasmee3GoalType.ayahs:
        return 'هدف الآيات اليومي';
    }
  }

  String get valueText {
    switch (goal.type) {
      case Tasmee3GoalType.sessions:
        return '$currentValue / $targetValue جلسة';
      case Tasmee3GoalType.minutes:
        return '$currentValue / $targetValue دقيقة';
      case Tasmee3GoalType.ayahs:
        return '$currentValue / $targetValue آية';
    }
  }
}
