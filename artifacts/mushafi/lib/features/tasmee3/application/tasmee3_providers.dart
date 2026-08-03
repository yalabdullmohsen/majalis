import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/advanced_quran_asr_recognizer.dart';
import '../data/asr_server_health_service.dart';
import '../data/assets_quran_repository.dart';
import '../data/ayah_mastery_repository.dart';
import '../data/live_asr_pcm_websocket_recognizer.dart';
import '../data/live_asr_websocket_recognizer.dart';
import '../data/local_ayah_mastery_repository.dart';
import '../data/local_tasmee3_asr_settings_repository.dart';
import '../data/local_tasmee3_failed_job_queue.dart';
import '../data/local_tasmee3_goal_repository.dart';
import '../data/local_tasmee3_session_repository.dart';
import '../data/pcm_audio_stream_service.dart';
import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../data/speech_to_text_quran_recognizer.dart';
import '../data/tasmee3_asr_settings_repository.dart';
import '../data/tasmee3_failed_job_queue.dart';
import '../data/tasmee3_goal_repository.dart';
import '../data/local_tasmee3_reminder_repository.dart';
import '../data/tasmee3_notification_service.dart';
import '../data/tasmee3_reminder_repository.dart';
import '../data/tasmee3_session_repository.dart';
import '../domain/asr_connection_status.dart';
import '../domain/asr_engine_mode.dart';
import '../domain/ayah_mastery_record.dart';
import '../domain/live_streaming_config.dart';
import '../domain/pcm_audio_config.dart';
import '../domain/queued_tasmee3_job.dart';
import '../domain/tasmee3_achievement.dart';
import '../domain/tasmee3_badge.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_daily_stats.dart';
import '../domain/tasmee3_goal_progress.dart';
import '../domain/tasmee3_reminder.dart';
import '../domain/tasmee3_review_plan_item.dart';
import '../domain/tasmee3_review_suggestion.dart';
import '../domain/tasmee3_session_record.dart';
import '../domain/tasmee3_user_asr_settings.dart';
import 'mistake_detection_engine.dart';
import 'tasmee3_analytics_service.dart';
import 'tasmee3_asr_settings.dart';
import 'tasmee3_asr_settings_controller.dart';
import 'tasmee3_controller.dart';
import 'tasmee3_goal_controller.dart';
import 'tasmee3_goal_service.dart';
import 'tasmee3_pdf_font_loader.dart';
import 'tasmee3_pdf_report_service.dart';
import 'tasmee3_reminders_controller.dart';
import 'tasmee3_display_builder.dart';
import 'tasmee3_live_follow_service.dart';
import 'tasmee3_session_report_builder.dart';
import 'tasmee3_srs_service.dart';
import 'tasmee3_review_suggestion_mapper.dart';
import 'tasmee3_ui_settings.dart';
import 'tasmee3_voice_command_detector.dart';

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

/// Uses user ASR settings (mode / allow upload / endpoint / live WS / PCM).
/// Priority: device fallback → native PCM WS → m4a chunk WS → advanced HTTP → STT.
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

  if (settings.canUseNativePcmStreaming) {
    return LiveAsrPcmWebSocketRecognizer(
      websocketUri: Uri.parse(settings.liveWebSocketEndpoint),
      apiKey: settings.apiKey.isEmpty ? null : settings.apiKey,
      pcmService: ref.watch(pcmAudioStreamServiceProvider),
      config: const PcmAudioConfig(
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        chunkSizeBytes: 3200,
      ),
    );
  }

  if (settings.canUseLiveWebSocket) {
    return LiveAsrWebSocketRecognizer(
      websocketUri: Uri.parse(settings.liveWebSocketEndpoint),
      apiKey: settings.apiKey.isEmpty ? null : settings.apiKey,
      config: const LiveStreamingConfig(
        chunkDuration: Duration(seconds: 3),
        partialTimeout: Duration(seconds: 8),
      ),
    );
  }

  if (settings.canUseAdvancedServer) {
    return buildAdvanced();
  }

  return SpeechToTextQuranRecognizer();
});

final pcmAudioStreamServiceProvider = Provider<PcmAudioStreamService>((ref) {
  return PcmAudioStreamService();
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

final ayahMasteryRepositoryProvider = Provider<AyahMasteryRepository>((ref) {
  return LocalAyahMasteryRepository();
});

final tasmee3SrsServiceProvider = Provider<Tasmee3SrsService>((ref) {
  return const Tasmee3SrsService();
});

final tasmee3DisplayBuilderProvider = Provider<Tasmee3DisplayBuilder>((ref) {
  return const Tasmee3DisplayBuilder();
});

final tasmee3LiveFollowServiceProvider =
    Provider<Tasmee3LiveFollowService>((ref) {
  return const Tasmee3LiveFollowService();
});

final tasmee3VoiceCommandDetectorProvider =
    Provider<Tasmee3VoiceCommandDetector>((ref) {
  return const Tasmee3VoiceCommandDetector();
});

final tasmee3ReviewSuggestionMapperProvider =
    Provider<Tasmee3ReviewSuggestionMapper>((ref) {
  return const Tasmee3ReviewSuggestionMapper();
});

final ayahMasteryRecordsProvider =
    FutureProvider<List<AyahMasteryRecord>>((ref) async {
  final repository = ref.watch(ayahMasteryRepositoryProvider);
  return repository.loadAll();
});

final tasmee3TodayReviewSuggestionsProvider =
    FutureProvider<List<Tasmee3ReviewSuggestion>>((ref) async {
  final records = await ref.watch(ayahMasteryRecordsProvider.future);
  final service = ref.watch(tasmee3SrsServiceProvider);
  return service.buildTodaySuggestions(records);
});

final tasmee3NextRangeSuggestionProvider =
    FutureProvider<Tasmee3ReviewSuggestion?>((ref) async {
  final records = await ref.watch(ayahMasteryRecordsProvider.future);
  final service = ref.watch(tasmee3SrsServiceProvider);
  return service.suggestNextRange(records);
});

final tasmee3Last7DaysStatsProvider =
    FutureProvider<List<Tasmee3DailyStats>>((ref) async {
  final sessions = await ref.watch(tasmee3SessionHistoryProvider.future);
  final analytics = ref.watch(tasmee3AnalyticsServiceProvider);
  return analytics.buildLast7DaysStats(sessions);
});

final tasmee3ReviewPlanProvider =
    FutureProvider<List<Tasmee3ReviewPlanItem>>((ref) async {
  final records = await ref.watch(ayahMasteryRecordsProvider.future);
  final srs = ref.watch(tasmee3SrsServiceProvider);
  final fromSrs = srs.buildReviewPlanFromMastery(records);

  if (fromSrs.isNotEmpty) {
    return fromSrs;
  }

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

final tasmee3NotificationServiceProvider =
    Provider<Tasmee3NotificationService>((ref) {
  return Tasmee3NotificationService();
});

final tasmee3PdfFontLoaderProvider = Provider<Tasmee3PdfFontLoader>((ref) {
  return const Tasmee3PdfFontLoader();
});

final tasmee3PdfReportServiceProvider =
    Provider<Tasmee3PdfReportService>((ref) {
  return Tasmee3PdfReportService(
    fontLoader: ref.watch(tasmee3PdfFontLoaderProvider),
  );
});

final tasmee3ReminderRepositoryProvider =
    Provider<Tasmee3ReminderRepository>((ref) {
  return LocalTasmee3ReminderRepository();
});

final tasmee3RemindersProvider =
    FutureProvider<List<Tasmee3Reminder>>((ref) async {
  final repository = ref.watch(tasmee3ReminderRepositoryProvider);
  return repository.loadReminders();
});

final tasmee3RemindersControllerProvider = StateNotifierProvider<
    Tasmee3RemindersController, Tasmee3RemindersState>((ref) {
  final repository = ref.watch(tasmee3ReminderRepositoryProvider);
  final notificationService = ref.watch(tasmee3NotificationServiceProvider);

  final asyncReminders = ref.watch(tasmee3RemindersProvider);

  final initial = asyncReminders.maybeWhen(
    data: (items) => items,
    orElse: () => [
      Tasmee3Reminder.defaultDailyGoal(),
      Tasmee3Reminder.defaultStreakProtection(),
      Tasmee3Reminder.defaultWeakSpotsReview(),
      Tasmee3Reminder.defaultSmartTime(),
      Tasmee3Reminder.defaultRamadanWird(),
    ],
  );

  return Tasmee3RemindersController(
    repository: repository,
    notificationService: notificationService,
    initialReminders: initial,
  );
});

final tasmee3GoalControllerProvider =
    StateNotifierProvider<Tasmee3GoalController, Tasmee3GoalState>((ref) {
  final repository = ref.watch(tasmee3GoalRepositoryProvider);
  final notificationService = ref.watch(tasmee3NotificationServiceProvider);
  final asyncGoal = ref.watch(tasmee3DailyGoalProvider);

  final initialGoal = asyncGoal.maybeWhen(
    data: (goal) => goal,
    orElse: () => const Tasmee3DailyGoal.defaults(),
  );

  return Tasmee3GoalController(
    repository: repository,
    notificationService: notificationService,
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
    ayahMasteryRepository: ref.watch(ayahMasteryRepositoryProvider),
    srsService: ref.watch(tasmee3SrsServiceProvider),
    liveFollowService: ref.watch(tasmee3LiveFollowServiceProvider),
    voiceCommandDetector: ref.watch(tasmee3VoiceCommandDetectorProvider),
    onSessionSaved: () {
      ref.invalidate(tasmee3SessionHistoryProvider);
      ref.invalidate(tasmee3TodayGoalProgressProvider);
      ref.invalidate(tasmee3StreakProvider);
      ref.invalidate(tasmee3BadgesProvider);
      ref.invalidate(tasmee3Last7DaysStatsProvider);
      ref.invalidate(tasmee3ReviewPlanProvider);
      ref.invalidate(ayahMasteryRecordsProvider);
      ref.invalidate(tasmee3TodayReviewSuggestionsProvider);
      ref.invalidate(tasmee3NextRangeSuggestionProvider);
    },
  );
});
