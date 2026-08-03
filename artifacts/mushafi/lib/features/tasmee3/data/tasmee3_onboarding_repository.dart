abstract class Tasmee3OnboardingRepository {
  Future<bool> hasSeenOnboarding();

  Future<void> markSeen();

  Future<void> reset();
}
