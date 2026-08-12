import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/presentation/tasmee3_onboarding_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Tasmee3OnboardingScreen renders first page', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: Tasmee3OnboardingScreen(),
        ),
      ),
    );

    await tester.pump();

    expect(find.text('تسميع بهدوء'), findsOneWidget);
  });
}
