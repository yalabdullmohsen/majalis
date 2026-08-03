import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/core/utils/arabic_numbers.dart';
import 'package:mushafi/features/quran/data/local_quran_repository.dart';
import 'package:mushafi/features/quran/domain/entities/quran_page.dart';
import 'package:mushafi/features/quran/domain/mushaf_layout_engine.dart';
import 'package:mushafi/features/quran/domain/repositories/quran_repository.dart';
import 'package:mushafi/features/settings/data/settings_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Override in main');
});

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository(ref.watch(sharedPreferencesProvider));
});

final quranRepositoryProvider = Provider<QuranRepository>((ref) {
  return LocalQuranRepository();
});

final quranReadyProvider = FutureProvider<IntegrityReport>((ref) async {
  final repo = ref.watch(quranRepositoryProvider);
  await repo.initialize();
  return repo.lastIntegrityReport;
});

final currentPageProvider = StateProvider<int>((ref) {
  final settings = ref.watch(settingsRepositoryProvider);
  return settings.lastPage;
});

final chromeVisibleProvider = StateProvider<bool>((ref) => false);

final highlightedAyahKeyProvider = StateProvider<String?>((ref) => null);

final themeModeProvider = StateProvider<MushafiThemeMode>((ref) {
  return ref.watch(settingsRepositoryProvider).themeMode;
});

final fontScaleProvider = StateProvider<double>((ref) {
  return ref.watch(settingsRepositoryProvider).fontScale;
});

final readingModeProvider = StateProvider<MushafReadingMode>((ref) {
  return ref.watch(settingsRepositoryProvider).readingMode;
});

final digitStyleProvider = StateProvider<DigitStyle>((ref) {
  return ref.watch(settingsRepositoryProvider).digitStyle;
});

final layoutEngineProvider = Provider<MushafLayoutEngine>((ref) {
  return MushafLayoutEngine(mode: ref.watch(readingModeProvider));
});

final quranPageProvider =
    FutureProvider.family<QuranPage, int>((ref, page) async {
  final repo = ref.watch(quranRepositoryProvider);
  return repo.getPage(page);
});
