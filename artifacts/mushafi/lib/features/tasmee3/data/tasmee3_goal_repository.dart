import '../domain/tasmee3_daily_goal.dart';

abstract class Tasmee3GoalRepository {
  Future<Tasmee3DailyGoal> loadGoal();

  Future<void> saveGoal(Tasmee3DailyGoal goal);

  Future<void> clearGoal();
}
