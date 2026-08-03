import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/tasmee3_goal_repository.dart';
import '../data/tasmee3_notification_service.dart';
import '../domain/tasmee3_daily_goal.dart';

class Tasmee3GoalState {
  final Tasmee3DailyGoal goal;
  final bool isSaving;
  final String? errorMessage;

  const Tasmee3GoalState({
    required this.goal,
    this.isSaving = false,
    this.errorMessage,
  });

  Tasmee3GoalState copyWith({
    Tasmee3DailyGoal? goal,
    bool? isSaving,
    String? errorMessage,
  }) {
    return Tasmee3GoalState(
      goal: goal ?? this.goal,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: errorMessage,
    );
  }
}

class Tasmee3GoalController extends StateNotifier<Tasmee3GoalState> {
  final Tasmee3GoalRepository repository;
  final Tasmee3NotificationService notificationService;

  Tasmee3GoalController({
    required this.repository,
    required this.notificationService,
    required Tasmee3DailyGoal initialGoal,
  }) : super(Tasmee3GoalState(goal: initialGoal));

  void updateGoal(Tasmee3DailyGoal goal) {
    state = state.copyWith(goal: goal, errorMessage: null);
  }

  Future<void> save() async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.saveGoal(state.goal);
      await notificationService.scheduleDailyReminder(state.goal);
      state = state.copyWith(isSaving: false);
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> reset() async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.clearGoal();
      await notificationService.cancelDailyReminder();
      state = const Tasmee3GoalState(
        goal: Tasmee3DailyGoal.defaults(),
        isSaving: false,
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }
}
