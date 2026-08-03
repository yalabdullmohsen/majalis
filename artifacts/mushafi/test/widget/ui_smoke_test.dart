import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/features/audio/presentation/widgets/mini_player.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:mushafi/features/quran/presentation/widgets/ayah_action_sheet.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('AyahActionSheet shows ayah actions', (tester) async {
    const ayah = Ayah(
      surahId: 1,
      ayahNumber: 1,
      globalAyahNumber: 1,
      pageNumber: 1,
      juzNumber: 1,
      hizbQuarter: 1,
      textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      textPlain: 'بسم الله الرحمن الرحيم',
      words: [],
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AyahActionSheet(
            ayah: ayah,
            colors: MushafiColors.light,
          ),
        ),
      ),
    );
    expect(find.textContaining('آية'), findsOneWidget);
    expect(find.text('تشغيل'), findsOneWidget);
    expect(find.text('مفضلة'), findsOneWidget);
  });

  testWidgets('MiniPlayer renders', (tester) async {
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const MaterialApp(home: Scaffold(body: MiniPlayer())),
      ),
    );
    await tester.pump();
    expect(find.textContaining('تلاوة'), findsOneWidget);
  });
}
