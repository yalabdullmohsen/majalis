import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/advanced_quran_asr_recognizer.dart';
import '../data/asr_server_health_service.dart';
import '../data/assets_quran_repository.dart';
import '../data/local_tasmee3_asr_settings_repository.dart';
import '../data/local_tasmee3_failed_job_queue.dart';
import '../data/local_tasmee3_goal_repository.dart';
import '../data/local_tasmee3_session_repository.dart';
import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../data/speech_to_text_quran_recognizer.dart';
import '../data/tasmee3_asr_settings_repository.dart';
import '../data/tasmee3_failed_job_queue.dart';
import '../data/tasmee3_goal_repository.dart';
import '../data/tasmee3_session_repository.dart';
import '../domain/asr_connection_status.dart';
import '../domain/asr_engine_mode.dart';
import '../domain/queued_tasmee3_job.dart';
import '../domain/tasmee3_achievement.dart';
import '../domain/tasmee3_badge.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_daily_stats.dart';
import '../domain/tasmee3_goal_progress.dart';
import '../domain/tasmee3_review_plan_item.dart';
import '../domain/tasmee3_session_record.dart';
import '../domain/tasmee3_user_asr_settings.dart';
import 'mistake_detection_engine.dart';
import 'tasmee3_analytics_service.dart';
import 'tasmee3_asr_settings.dart';
import 'tasmee3_asr_settings_controller.dart';
import 'tasmee3_controller.dart';
import 'tasmee3_goal_controller.dart';
import 'tasmee3_goal_service.dart';
import 'tasmee3_session_report_builder.dart';
import 'tasmee3_ui_settings.dart';

/// Named distinctly from mushaf `quranRepositoryProvider` to avoid import clashes
/// when both libraries are imported in the same file.
final quranRepositoryProvider = Provider<QuranRepository>((ref) {
  return AssetsQuranRepository();
});

/// Legacy compile-time settings from `--dart-define` (kept for backward compat).
final legacyTasmee3AsrSettingsProvider = Provider<Tasmee3AsrSettings>((ref) {
  return Tasmee3AsrSettings.fromEnvironment();
});

/// @Deprecated Prefer [tasmee3UserAsrSettingsProvider]. Kept as alias to legacy
/// dart-define settings for any remaining call sites.
final tasmee3AsrSettingsProvider = legacyTasmee3AsrSettingsProvider;

final tasmee3AsrSettingsRepositoryProvider =
    Provider<Tasmee3AsrSettingsRepository>((ref) {
  return LocalTasmee3AsrSettingsRepository();
});

final tasmee3UserAsrSettingsProvider =
    FutureProvider<Tasmee3UserAsrSettings>((ref) async {
  final repository = ref.watch(tasmee3AsrSettingsRepositoryProvider);
  return repository.load();
});

final asrServerHealthServiceProvider = Provider<AsrServerHealthService>((ref) {
  return AsrServerHealthService();
});

final tasmee3ConnectionStatusProvider =
    StateProvider<AsrConnectionStatus>((ref) {
  return AsrConnectionStatus.unknown();
});

final tasmee3FailedJobQueueProvider = Provider<Tasmee3FailedJobQueue>((ref) {
  return LocalTasmee3FailedJobQueue();
});

final tasmee3FailedJobsProvider =
    FutureProvider<List<QueuedTasmee3Job>>((ref) async {
  final queue = ref.watch(tasmee3FailedJobQueueProvider);
  return queue.getJobs();
});

final tasmee3AsrSettingsControllerProvider = StateNotifierProvider<
    Tasmee3AsrSettingsController, Tasmee3AsrSettingsState>((ref) {
  final repository = ref.watch(tasmee3AsrSettingsRepositoryProvider);
  final health = ref.watch(asrServerHealthServiceProvider);

  final asyncSettings = ref.watch(tasmee3UserAsrSettingsProvider);

  final initial = asyncSettings.maybeWhen(
    data: (value) => value,
    orElse: () => const Tasmee3UserAsrSettings.defaults(),
  );

  return Tasmee3AsrSettingsController(
    repository: repository,
    healthService: health,
    initialSettings: initial,
  );
});

/// Uses user ASR settings (mode / allow upload / endpoint). Falls back to
/// [SpeechToTextQuranRecognizer] when advanced server cannot be used.
final quranSpeechRecognizerProvider = Provider<QuranSpeechRecognizer>((ref) {
  final asyncSettings = ref.watch(tasmee3UserAsrSettingsProvider);
  final queue = ref.watch(tasmee3FailedJobQueueProvider);

  final settings = asyncSettings.maybeWhen(
    data: (value) => value,
    orElse: () => const Tasmee3UserAsrSettings.defaults(),
  );

  final maxRetry =
      settings.enableAutoRetry ? settings.maxRetryCount : 0;

  AdvancedQuranAsrRecognizer buildAdvanced() {
    return AdvancedQuranAsrRecognizer(
      endpoint: Uri.parse(settings.endpoint),
      apiKey: settings.apiKey.isEmpty ? null : settings.apiKey,
      maxRetryCount: maxRetry,
      failedJobQueue:
          settings.saveFailedSessionsQueue ? queue : null,
      saveFailedSessionsQueue: settings.saveFailedSessionsQueue,
    );
  }

  if (settings.mode == AsrEngineMode.deviceFallback) {
    return SpeechToTextQuranRecognizer();
  }

  if (settings.mode == AsrEngineMode.advancedServer) {
    if (settings.canUseAdvancedServer) {
      return buildAdvanced();
    }

    return SpeechToTextQuranRecognizer();
  }

  if (settings.mode == AsrEngineMode.auto) {
    if (settings.canUseAdvancedServer) {
      return buildAdvanced();
    }

    return SpeechToTextQuranRecognizer();
  }

  return SpeechToTextQuranRecognizer();
});

final mistakeDetectionEngineProvider = Provider<MistakeDetectionEngine>((ref) {
  return const MistakeDetectionEngine();
});

final tasmee3UiSettingsProvider = Provider<Tasmee3UiSettings>((ref) {
  return const Tasmee3UiSettings();
});

final tasmee3SessionRepositoryProvider =
    Provider<Tasmee3SessionRepository>((ref) {
  return LocalTasmee3SessionRepository();
});

final tasmee3SessionHistoryProvider =
    FutureProvider<List<Tasmee3SessionRecord>>((ref) async {
  final repository = ref.watch(tasmee3SessionRepositoryProvider);
  return repository.getSessions();
});

final tasmee3AnalyticsServiceProvider =
    Provider<Tasmee3AnalyticsService>((ref) {
  return const Tasmee3AnalyticsService();
});

final tasmee3Last7DaysStatsProvider =
    FutureProvider<List<Tasmee3DailyStats>>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final analytics = ref.watch(tasmee3AnalyticsServiceProvider);
  return analytics.buildLast7DaysStats(sessions);
});

final tasmee3ReviewPlanProvider =
    FutureProvider<List<Tasmee3ReviewPlanItem>>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final analytics = ref.watch(tasmee3AnalyticsServiceProvider);
  return analytics.buildWeeklyReviewPlan(sessions);
});

final tasmee3AchievementsProvider =
    FutureProvider<List<Tasmee3Achievement>>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final analytics = ref.watch(tasmee3AnalyticsServiceProvider);
  return analytics.buildAchievements(sessions);
});

final tasmee3GoalRepositoryProvider = Provider<Tasmee3GoalRepository>((ref) {
  return LocalTasmee3GoalRepository();
});

final tasmee3GoalServiceProvider = Provider<Tasmee3GoalService>((ref) {
  return const Tasmee3GoalService();
});

final tasmee3DailyGoalProvider = FutureProvider<Tasmee3DailyGoal>((ref) async {
  final repository = ref.watch(tasmee3GoalRepositoryProvider);
  return repository.loadGoal();
});

final tasmee3TodayGoalProgressProvider =
    FutureProvider<Tasmee3GoalProgress>((ref) async {
  final goal = await ref.watch(tasmee3DailyGoalProvider.future);
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final service = ref.watch(tasmee3GoalServiceProvider);

  return service.buildTodayProgress(
    goal: goal,
    sessions: sessions,
  );
});

final tasmee3StreakProvider = FutureProvider<int>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final service = ref.watch(tasmee3GoalServiceProvider);

  return service.calculateStreak(sessions);
});

final tasmee3BadgesProvider = FutureProvider<List<Tasmee3Badge>>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final service = ref.watch(tasmee3GoalServiceProvider);

  return service.buildBadges(sessions);
});

final tasmee3GoalControllerProvider =
    StateNotifierProvider<Tasmee3GoalController, Tasmee3GoalState>((ref) {
  final repository = ref.watch(tasmee3GoalRepositoryProvider);
  final asyncGoal = ref.watch(tasmee3DailyGoalProvider);

  final initialGoal = asyncGoal.maybeWhen(
    data: (goal) => goal,
    orElse: () => const Tasmee3DailyGoal.defaults(),
  );

  return Tasmee3GoalController(
    repository: repository,
    initialGoal: initialGoal,
  );
});

final tasmee3SessionReportBuilderProvider =
    Provider<Tasmee3SessionReportBuilder>((ref) {
  return const Tasmee3SessionReportBuilder();
});

final tasmee3ControllerProvider =
    StateNotifierProvider<Tasmee3Controller, Tasmee3State>((ref) {
  return Tasmee3Controller(
    quranRepository: ref.watch(quranRepositoryProvider),
    recognizer: ref.watch(quranSpeechRecognizerProvider),
    engine: ref.watch(mistakeDetectionEngineProvider),
    sessionRepository: ref.watch(tasmee3SessionRepositoryProvider),
    onSessionSaved: () {
      ref.invalidate(tasmee3SessionHistoryProvider);
      ref.invalidate(tasmee3TodayGoalProgressProvider);
      ref.invalidate(tasmee3StreakProvider);
      ref.invalidate(tasmee3BadgesProvider);
      ref.invalidate(tasmee3Last7DaysStatsProvider);
      ref.invalidate(tasmee3ReviewPlanProvider);
    },
  );
});
