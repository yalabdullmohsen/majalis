import '../data/ayah_mastery_repository.dart';
import '../data/tasmee3_asr_settings_repository.dart';
import '../data/tasmee3_failed_job_queue.dart';
import '../data/tasmee3_goal_repository.dart';
import '../data/tasmee3_onboarding_repository.dart';
import '../data/tasmee3_reminder_repository.dart';
import '../data/tasmee3_session_repository.dart';

/// يعيد ضبط بيانات التسميع المحلية فقط.
/// TODO: إعادة ضبط بيانات المصحف (ختمة/مفضلة/…) منفصلة عن Tasmee3.
class Tasmee3ResetService {
  final Tasmee3SessionRepository sessionRepository;
  final Tasmee3GoalRepository goalRepository;
  final Tasmee3ReminderRepository reminderRepository;
  final Tasmee3AsrSettingsRepository asrSettingsRepository;
  final Tasmee3FailedJobQueue failedJobQueue;
  final AyahMasteryRepository ayahMasteryRepository;
  final Tasmee3OnboardingRepository onboardingRepository;

  const Tasmee3ResetService({
    required this.sessionRepository,
    required this.goalRepository,
    required this.reminderRepository,
    required this.asrSettingsRepository,
    required this.failedJobQueue,
    required this.ayahMasteryRepository,
    required this.onboardingRepository,
  });

  Future<void> resetTasmee3LocalData({
    bool resetOnboarding = false,
    bool resetAsrSettings = false,
  }) async {
    await sessionRepository.clearSessions();
    await goalRepository.clearGoal();
    await reminderRepository.clear();
    await failedJobQueue.clear();
    await ayahMasteryRepository.clear();

    if (resetAsrSettings) {
      await asrSettingsRepository.clear();
    }

    if (resetOnboarding) {
      await onboardingRepository.reset();
    }
  }
}
