class Tasmee3DailyStats {
  final DateTime day;
  final int sessionsCount;
  final int totalDurationSeconds;
  final int totalMistakes;
  final double averageAccuracy;

  const Tasmee3DailyStats({
    required this.day,
    required this.sessionsCount,
    required this.totalDurationSeconds,
    required this.totalMistakes,
    required this.averageAccuracy,
  });

  int get averageAccuracyPercent => (averageAccuracy * 100).round();

  int get totalDurationMinutes => (totalDurationSeconds / 60).round();
}
