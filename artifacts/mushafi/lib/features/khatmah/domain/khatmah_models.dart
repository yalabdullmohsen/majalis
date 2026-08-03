import 'package:equatable/equatable.dart';

enum KhatmahGoalUnit { pages, juz, ayahs }

class KhatmahPlan extends Equatable {
  const KhatmahPlan({
    required this.id,
    required this.title,
    required this.dailyGoal,
    required this.unit,
    required this.startDate,
    required this.expectedEnd,
    required this.completedUnits,
    required this.totalUnits,
    required this.streak,
    required this.missedDays,
    required this.lastPage,
    required this.archived,
  });

  final String id;
  final String title;
  final int dailyGoal;
  final KhatmahGoalUnit unit;
  final DateTime startDate;
  final DateTime expectedEnd;
  final int completedUnits;
  final int totalUnits;
  final int streak;
  final int missedDays;
  final int lastPage;
  final bool archived;

  double get progress =>
      totalUnits == 0 ? 0 : (completedUnits / totalUnits).clamp(0.0, 1.0);

  KhatmahPlan copyWith({
    int? dailyGoal,
    int? completedUnits,
    int? streak,
    int? missedDays,
    int? lastPage,
    bool? archived,
    DateTime? expectedEnd,
  }) =>
      KhatmahPlan(
        id: id,
        title: title,
        dailyGoal: dailyGoal ?? this.dailyGoal,
        unit: unit,
        startDate: startDate,
        expectedEnd: expectedEnd ?? this.expectedEnd,
        completedUnits: completedUnits ?? this.completedUnits,
        totalUnits: totalUnits,
        streak: streak ?? this.streak,
        missedDays: missedDays ?? this.missedDays,
        lastPage: lastPage ?? this.lastPage,
        archived: archived ?? this.archived,
      );

  @override
  List<Object?> get props => [id, completedUnits, dailyGoal, archived];
}

class KhatmahProgressCalculator {
  static double progress({required int completed, required int total}) {
    if (total <= 0) return 0;
    return (completed / total).clamp(0.0, 1.0);
  }

  static int remaining({required int completed, required int total}) =>
      (total - completed).clamp(0, total);

  static DateTime expectedEnd({
    required DateTime start,
    required int total,
    required int dailyGoal,
  }) {
    final days = dailyGoal <= 0 ? total : (total / dailyGoal).ceil();
    return start.add(Duration(days: days));
  }
}
