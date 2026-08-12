import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/data/local_tasmee3_onboarding_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  test('LocalTasmee3OnboardingRepository marks and resets onboarding', () async {
    final repository = LocalTasmee3OnboardingRepository();

    expect(await repository.hasSeenOnboarding(), isFalse);

    await repository.markSeen();
    expect(await repository.hasSeenOnboarding(), isTrue);

    await repository.reset();
    expect(await repository.hasSeenOnboarding(), isFalse);
  });
}
