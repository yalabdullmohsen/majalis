import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/khatmah_plan_repository.dart';
import '../domain/khatmah_plan.dart';
import '../domain/khatmah_plan_status.dart';
import '../domain/khatmah_reading_log.dart';
import '../domain/khatmah_statistics.dart';
import 'khatmah_statistics_service.dart';

class KhatmahPlanState {
  final List<KhatmahPlan> plans;
  final List<KhatmahReadingLog> logs;
  final KhatmahStatistics statistics;
  final bool isLoading;
  final String? errorMessage;

  const KhatmahPlanState({
    required this.plans,
    required this.logs,
    required this.statistics,
    this.isLoading = false,
    this.errorMessage,
  });

  factory KhatmahPlanState.initial() {
    return const KhatmahPlanState(
      plans: [],
      logs: [],
      statistics: KhatmahStatistics(
        pagesToday: 0,
        pagesThisWeek: 0,
        averagePagesPerDay: 0,
        activePlansCount: 0,
        completedPlansCount: 0,
      ),
    );
  }

  KhatmahPlan? get activePlan {
    for (final plan in plans) {
      if (plan.status == KhatmahPlanStatus.active) {
        return plan;
      }
    }

    return null;
  }

  List<KhatmahPlan> get archivedPlans {
    return plans
        .where(
          (plan) =>
              plan.status == KhatmahPlanStatus.completed ||
              plan.status == KhatmahPlanStatus.archived,
        )
        .toList();
  }

  KhatmahPlanState copyWith({
    List<KhatmahPlan>? plans,
    List<KhatmahReadingLog>? logs,
    KhatmahStatistics? statistics,
    bool? isLoading,
    String? errorMessage,
  }) {
    return KhatmahPlanState(
      plans: plans ?? this.plans,
      logs: logs ?? this.logs,
      statistics: statistics ?? this.statistics,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class KhatmahPlanController extends StateNotifier<KhatmahPlanState> {
  final KhatmahPlanRepository repository;
  final KhatmahStatisticsService statisticsService;

  KhatmahPlanController({
    required this.repository,
    required this.statisticsService,
  }) : super(KhatmahPlanState.initial());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final plans = await repository.getPlans();
      final logs = await repository.getLogs();
      final stats = statisticsService.build(plans: plans, logs: logs);

      state = state.copyWith(
        plans: plans,
        logs: logs,
        statistics: stats,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> createPlan({
    required String title,
    required int targetDays,
    int startPage = 1,
  }) async {
    final existingActive = state.activePlan;

    if (existingActive != null) {
      final paused = existingActive.copyWith(
        status: KhatmahPlanStatus.paused,
        updatedAt: DateTime.now(),
      );

      await repository.savePlan(paused);
    }

    final plan = KhatmahPlan.newPlan(
      title: title,
      targetDays: targetDays,
      startPage: startPage,
    );

    await repository.savePlan(plan);
    await load();
  }

  Future<void> markPagesRead({
    required int fromPage,
    required int toPage,
  }) async {
    final active = state.activePlan;

    if (active == null) {
      return;
    }

    final normalizedFrom = fromPage < 1 ? 1 : fromPage;
    final normalizedTo =
        toPage > active.totalPages ? active.totalPages : toPage;

    final pagesCount = normalizedTo >= normalizedFrom
        ? normalizedTo - normalizedFrom + 1
        : 0;

    if (pagesCount <= 0) {
      return;
    }

    final newPagesRead = active.pagesRead + pagesCount;
    final completed = newPagesRead >= active.totalPages;

    final updated = active.copyWith(
      currentPage: normalizedTo,
      pagesRead:
          newPagesRead > active.totalPages ? active.totalPages : newPagesRead,
      completedAt: completed ? DateTime.now() : null,
      status: completed ? KhatmahPlanStatus.completed : active.status,
      updatedAt: DateTime.now(),
    );

    final log = KhatmahReadingLog(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      planId: active.id,
      fromPage: normalizedFrom,
      toPage: normalizedTo,
      pagesCount: pagesCount,
      readAt: DateTime.now(),
    );

    await repository.savePlan(updated);
    await repository.addLog(log);
    await load();
  }

  Future<void> pausePlan(String id) async {
    final plan = state.plans.firstWhere((item) => item.id == id);

    await repository.savePlan(
      plan.copyWith(
        status: KhatmahPlanStatus.paused,
        updatedAt: DateTime.now(),
      ),
    );

    await load();
  }

  Future<void> resumePlan(String id) async {
    for (final plan in state.plans) {
      if (plan.status == KhatmahPlanStatus.active) {
        await repository.savePlan(
          plan.copyWith(
            status: KhatmahPlanStatus.paused,
            updatedAt: DateTime.now(),
          ),
        );
      }
    }

    final selected = state.plans.firstWhere((item) => item.id == id);

    await repository.savePlan(
      selected.copyWith(
        status: KhatmahPlanStatus.active,
        updatedAt: DateTime.now(),
      ),
    );

    await load();
  }

  Future<void> archivePlan(String id) async {
    final plan = state.plans.firstWhere((item) => item.id == id);

    await repository.savePlan(
      plan.copyWith(
        status: KhatmahPlanStatus.archived,
        updatedAt: DateTime.now(),
      ),
    );

    await load();
  }

  Future<void> deletePlan(String id) async {
    await repository.deletePlan(id);
    await load();
  }
}
