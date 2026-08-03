import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/tasmee3_notification_service.dart';
import '../data/tasmee3_reminder_repository.dart';
import '../domain/tasmee3_reminder.dart';
import '../domain/tasmee3_reminder_type.dart';
import '../domain/tasmee3_session_record.dart';

class Tasmee3RemindersState {
  final List<Tasmee3Reminder> reminders;
  final bool isSaving;
  final String? errorMessage;

  const Tasmee3RemindersState({
    required this.reminders,
    this.isSaving = false,
    this.errorMessage,
  });

  Tasmee3RemindersState copyWith({
    List<Tasmee3Reminder>? reminders,
    bool? isSaving,
    String? errorMessage,
  }) {
    return Tasmee3RemindersState(
      reminders: reminders ?? this.reminders,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: errorMessage,
    );
  }
}

class Tasmee3RemindersController extends StateNotifier<Tasmee3RemindersState> {
  final Tasmee3ReminderRepository repository;
  final Tasmee3NotificationService notificationService;

  Tasmee3RemindersController({
    required this.repository,
    required this.notificationService,
    required List<Tasmee3Reminder> initialReminders,
  }) : super(Tasmee3RemindersState(reminders: initialReminders));

  void updateReminder(Tasmee3Reminder reminder) {
    final updated = state.reminders.map((item) {
      if (item.id == reminder.id) {
        return reminder;
      }

      return item;
    }).toList();

    state = state.copyWith(reminders: updated, errorMessage: null);
  }

  /// Suggests a smart reminder hour from the user's recent session times.
  String suggestSmartTime(List<Tasmee3SessionRecord> sessions) {
    if (sessions.isEmpty) {
      return '20:00';
    }

    final recent = sessions.take(20).toList();
    final hourCounts = <int, int>{};

    for (final session in recent) {
      final hour = session.createdAt.hour;
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }

    final bestHour = hourCounts.entries
        .reduce((a, b) => a.value >= b.value ? a : b)
        .key;

    return '${bestHour.toString().padLeft(2, '0')}:00';
  }

  Future<void> save({List<Tasmee3SessionRecord>? sessions}) async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      var reminders = state.reminders;

      if (sessions != null && sessions.isNotEmpty) {
        final smartTime = suggestSmartTime(sessions);
        reminders = reminders.map((item) {
          if (item.type == Tasmee3ReminderType.smartTime && item.enabled) {
            return item.copyWith(time: smartTime);
          }
          return item;
        }).toList();
      }

      await repository.saveReminders(reminders);
      await notificationService.scheduleAll(reminders);

      state = state.copyWith(
        reminders: reminders,
        isSaving: false,
      );
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
      await repository.clear();
      await notificationService.cancelManagedReminders();

      final reminders = await repository.loadReminders();

      state = Tasmee3RemindersState(
        reminders: reminders,
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
