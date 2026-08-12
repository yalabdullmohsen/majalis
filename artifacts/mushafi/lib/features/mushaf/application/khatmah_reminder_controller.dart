import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/khatmah_reminder_settings_repository.dart';
import '../domain/khatmah_plan.dart';
import '../domain/khatmah_reminder_settings.dart';
import 'khatmah_notification_service.dart';

class KhatmahReminderState {
  final KhatmahReminderSettings settings;
  final bool isSaving;
  final String? errorMessage;

  const KhatmahReminderState({
    required this.settings,
    this.isSaving = false,
    this.errorMessage,
  });

  const KhatmahReminderState.initial()
      : settings = const KhatmahReminderSettings.defaults(),
        isSaving = false,
        errorMessage = null;

  KhatmahReminderState copyWith({
    KhatmahReminderSettings? settings,
    bool? isSaving,
    String? errorMessage,
  }) {
    return KhatmahReminderState(
      settings: settings ?? this.settings,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: errorMessage,
    );
  }
}

class KhatmahReminderController extends StateNotifier<KhatmahReminderState> {
  final KhatmahReminderSettingsRepository repository;
  final KhatmahNotificationService notificationService;

  KhatmahReminderController({
    required this.repository,
    required this.notificationService,
  }) : super(const KhatmahReminderState.initial());

  Future<void> load() async {
    final settings = await repository.load();
    state = state.copyWith(settings: settings);
  }

  void update(KhatmahReminderSettings settings) {
    state = state.copyWith(settings: settings, errorMessage: null);
  }

  Future<void> save({
    required KhatmahPlan? activePlan,
  }) async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.save(state.settings);

      if (activePlan != null) {
        await notificationService.scheduleDailyReminder(
          plan: activePlan,
          settings: state.settings,
        );

        await notificationService.scheduleLateReminder(
          plan: activePlan,
          settings: state.settings,
        );
      } else {
        await notificationService.cancelAll();
      }

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
      await repository.reset();
      await notificationService.cancelAll();

      state = const KhatmahReminderState.initial();
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }
}
