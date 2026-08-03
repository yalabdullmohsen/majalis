import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/application/tasmee3_providers.dart';
import '../data/assets_quran_page_metadata_repository.dart';
import '../data/assets_tafsir_repository.dart';
import '../data/khatmah_plan_repository.dart';
import '../data/mushaf_audio_download_repository.dart';
import '../data/mushaf_audio_settings_repository.dart';
import '../data/mushaf_local_repository.dart';
import '../data/mushaf_reading_settings_repository.dart';
import '../data/mushaf_search_history_repository.dart';
import '../data/quran_page_metadata_repository.dart';
import '../data/shared_prefs_khatmah_plan_repository.dart';
import '../data/shared_prefs_mushaf_audio_download_repository.dart';
import '../data/shared_prefs_mushaf_audio_settings_repository.dart';
import '../data/shared_prefs_mushaf_local_repository.dart';
import '../data/shared_prefs_mushaf_reading_settings_repository.dart';
import '../data/shared_prefs_mushaf_search_history_repository.dart';
import '../data/tafsir_catalog.dart';
import '../data/tafsir_repository.dart';
import '../domain/mushaf_audio_download.dart';
import '../domain/mushaf_audio_settings.dart';
import '../domain/mushaf_audio_state.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_page.dart';
import '../domain/mushaf_reading_position.dart';
import '../domain/mushaf_reading_settings.dart';
import '../domain/mushaf_search_history_item.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/quran_page_metadata.dart';
import '../domain/tafsir_search_index_item.dart';
import '../domain/tafsir_source.dart';
import 'ayah_share_text_builder.dart';
import 'khatmah_plan_controller.dart';
import 'khatmah_statistics_service.dart';
import 'mushaf_audio_controller.dart';
import 'mushaf_audio_download_controller.dart';
import 'mushaf_audio_download_service.dart';
import 'mushaf_controller.dart';
import 'mushaf_page_builder.dart';
import 'mushaf_reading_settings_controller.dart';
import 'mushaf_search_controller.dart';
import 'mushaf_search_index_builder.dart';
import 'mushaf_search_service.dart';
import 'mushaf_search_suggestions_service.dart';
import 'quran_page_metadata_integrity_service.dart';
import 'tafsir_integrity_service.dart';
import 'tafsir_search_index_builder.dart';
import 'widget_image_export_service.dart';


final mushafPageBuilderProvider = Provider<MushafPageBuilder>((ref) {
  return const MushafPageBuilder();
});

final quranPageMetadataRepositoryProvider =
    Provider<QuranPageMetadataRepository>((ref) {
  return AssetsQuranPageMetadataRepository();
});

final quranPageMetadataProvider =
    FutureProvider<List<QuranPageMetadata>>((ref) async {
  final repository = ref.watch(quranPageMetadataRepositoryProvider);
  return repository.loadAll();
});

final mushafPagesProvider = FutureProvider<List<MushafPage>>((ref) async {
  final quranRepository = ref.watch(quranRepositoryProvider);
  final builder = ref.watch(mushafPageBuilderProvider);

  final ayahs = await quranRepository.getAllAyahs();

  var metadata = const <QuranPageMetadata>[];

  try {
    metadata = await ref.watch(quranPageMetadataProvider.future);
  } catch (_) {
    metadata = const [];
  }

  return builder.buildPages(
    ayahs: ayahs,
    metadata: metadata,
  );
});

final tafsirRepositoryProvider = Provider<TafsirRepository>((ref) {
  return AssetsTafsirRepository();
});

final mushafLocalRepositoryProvider = Provider<MushafLocalRepository>((ref) {
  return SharedPrefsMushafLocalRepository();
});

final mushafReadingSettingsRepositoryProvider =
    Provider<MushafReadingSettingsRepository>((ref) {
  return SharedPrefsMushafReadingSettingsRepository();
});

final mushafReadingSettingsProvider =
    FutureProvider<MushafReadingSettings>((ref) async {
  final repository = ref.watch(mushafReadingSettingsRepositoryProvider);
  return repository.load();
});

final mushafReadingSettingsControllerProvider = StateNotifierProvider<
    MushafReadingSettingsController, MushafReadingSettingsState>((ref) {
  final repository = ref.watch(mushafReadingSettingsRepositoryProvider);

  final controller = MushafReadingSettingsController(
    repository: repository,
    initialSettings: const MushafReadingSettings.defaults(),
  );
  controller.load();

  return controller;
});

final mushafControllerProvider =
    StateNotifierProvider<MushafController, MushafState>((ref) {
  final repository = ref.watch(mushafLocalRepositoryProvider);

  final controller = MushafController(repository: repository);
  controller.load();

  return controller;
});

final ayahShareTextBuilderProvider = Provider<AyahShareTextBuilder>((ref) {
  return const AyahShareTextBuilder();
});

final widgetImageExportServiceProvider =
    Provider<WidgetImageExportService>((ref) {
  return const WidgetImageExportService();
});

final quranPageMetadataIntegrityServiceProvider =
    Provider<QuranPageMetadataIntegrityService>((ref) {
  return const QuranPageMetadataIntegrityService();
});

final quranPageMetadataIntegrityReportProvider =
    FutureProvider<QuranPageMetadataIntegrityReport>((ref) async {
  final metadata = await ref.watch(quranPageMetadataProvider.future);
  final service = ref.watch(quranPageMetadataIntegrityServiceProvider);

  return service.validate(metadata);
});

final mushafLastPositionProvider =
    FutureProvider<MushafReadingPosition?>((ref) async {
  final repository = ref.watch(mushafLocalRepositoryProvider);
  return repository.getLastPosition();
});

final mushafFavoritesProvider =
    FutureProvider<List<MushafFavoriteAyah>>((ref) async {
  final repository = ref.watch(mushafLocalRepositoryProvider);
  return repository.getFavorites();
});

final mushafAudioSettingsRepositoryProvider =
    Provider<MushafAudioSettingsRepository>((ref) {
  return SharedPrefsMushafAudioSettingsRepository();
});

final mushafAudioSettingsProvider =
    FutureProvider<MushafAudioSettings>((ref) async {
  final repository = ref.watch(mushafAudioSettingsRepositoryProvider);
  return repository.load();
});

final mushafAudioDownloadRepositoryProvider =
    Provider<MushafAudioDownloadRepository>((ref) {
  return SharedPrefsMushafAudioDownloadRepository();
});

final mushafAudioDownloadServiceProvider =
    Provider<MushafAudioDownloadService>((ref) {
  return MushafAudioDownloadService(
    repository: ref.watch(mushafAudioDownloadRepositoryProvider),
  );
});

final mushafAudioDownloadsProvider =
    FutureProvider<List<MushafAudioDownload>>((ref) async {
  final repository = ref.watch(mushafAudioDownloadRepositoryProvider);
  return repository.getAll();
});

final mushafAudioDownloadControllerProvider = StateNotifierProvider<
    MushafAudioDownloadController, MushafAudioDownloadState>((ref) {
  return MushafAudioDownloadController(
    service: ref.watch(mushafAudioDownloadServiceProvider),
  );
});

final mushafAudioControllerProvider =
    StateNotifierProvider<MushafAudioController, MushafAudioState>((ref) {
  return MushafAudioController(
    settingsRepository: ref.watch(mushafAudioSettingsRepositoryProvider),
    downloadRepository: ref.watch(mushafAudioDownloadRepositoryProvider),
  );
});

final mushafSearchHistoryRepositoryProvider =
    Provider<MushafSearchHistoryRepository>((ref) {
  return SharedPrefsMushafSearchHistoryRepository();
});

final mushafSearchHistoryProvider =
    FutureProvider<List<MushafSearchHistoryItem>>((ref) async {
  final repository = ref.watch(mushafSearchHistoryRepositoryProvider);
  return repository.load();
});

final mushafSearchServiceProvider = Provider<MushafSearchService>((ref) {
  return const MushafSearchService();
});

final mushafSearchIndexBuilderProvider =
    Provider<MushafSearchIndexBuilder>((ref) {
  return MushafSearchIndexBuilder(
    pageMetadataRepository: ref.watch(quranPageMetadataRepositoryProvider),
  );
});

final mushafSearchIndexProvider =
    FutureProvider<List<MushafSearchIndexItem>>((ref) async {
  final quranRepository = ref.watch(quranRepositoryProvider);
  final builder = ref.watch(mushafSearchIndexBuilderProvider);

  final ayahs = await quranRepository.getAllAyahs();

  return builder.build(ayahs);
});

final mushafSearchSuggestionsServiceProvider =
    Provider<MushafSearchSuggestionsService>((ref) {
  return const MushafSearchSuggestionsService();
});

final mushafSearchSuggestionsProvider =
    FutureProvider<List<String>>((ref) async {
  final index = await ref.watch(mushafSearchIndexProvider.future);
  final service = ref.watch(mushafSearchSuggestionsServiceProvider);

  return service.buildSuggestions(index);
});

final selectedTafsirSourceProvider = Provider<TafsirSource>((ref) {
  return TafsirCatalog.defaultSource();
});

final tafsirSearchIndexBuilderProvider =
    Provider<TafsirSearchIndexBuilder>((ref) {
  return TafsirSearchIndexBuilder(
    quranRepository: ref.watch(quranRepositoryProvider),
    tafsirRepository: ref.watch(tafsirRepositoryProvider),
    pageMetadataRepository: ref.watch(quranPageMetadataRepositoryProvider),
  );
});

final tafsirSearchIndexProvider =
    FutureProvider<List<TafsirSearchIndexItem>>((ref) async {
  final builder = ref.watch(tafsirSearchIndexBuilderProvider);
  final source = ref.watch(selectedTafsirSourceProvider);

  return builder.build(source);
});

final tafsirIntegrityServiceProvider = Provider<TafsirIntegrityService>((ref) {
  return const TafsirIntegrityService();
});

final tafsirIntegrityReportProvider =
    FutureProvider<TafsirIntegrityReport>((ref) async {
  final repository = ref.watch(tafsirRepositoryProvider);
  final source = ref.watch(selectedTafsirSourceProvider);
  final service = ref.watch(tafsirIntegrityServiceProvider);

  final entries = await repository.getAllEntries(source);

  return service.validate(entries);
});

final mushafSearchControllerProvider =
    StateNotifierProvider<MushafSearchController, MushafSearchState>((ref) {
  return MushafSearchController(
    loadIndex: () => ref.read(mushafSearchIndexProvider.future),
    loadTafsirIndex: () => ref.read(tafsirSearchIndexProvider.future),
    searchService: ref.watch(mushafSearchServiceProvider),
    historyRepository: ref.watch(mushafSearchHistoryRepositoryProvider),
  );
});

final khatmahPlanRepositoryProvider = Provider<KhatmahPlanRepository>((ref) {
  return SharedPrefsKhatmahPlanRepository();
});

final khatmahStatisticsServiceProvider =
    Provider<KhatmahStatisticsService>((ref) {
  return const KhatmahStatisticsService();
});

final khatmahPlanControllerProvider =
    StateNotifierProvider<KhatmahPlanController, KhatmahPlanState>((ref) {
  final controller = KhatmahPlanController(
    repository: ref.watch(khatmahPlanRepositoryProvider),
    statisticsService: ref.watch(khatmahStatisticsServiceProvider),
  );

  controller.load();

  return controller;
});
