import 'package:shared_preferences/shared_preferences.dart';

import 'tasmee3_onboarding_repository.dart';

class LocalTasmee3OnboardingRepository implements Tasmee3OnboardingRepository {
  static const String _key = 'tasmee3_has_seen_onboarding';

  @override
  Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_key) ?? false;
  }

  @override
  Future<void> markSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, true);
  }

  @override
  Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
