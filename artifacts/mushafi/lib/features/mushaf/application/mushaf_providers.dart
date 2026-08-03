import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/application/tasmee3_providers.dart';
import '../data/assets_tafsir_repository.dart';
import '../data/mushaf_local_repository.dart';
import '../data/shared_prefs_mushaf_local_repository.dart';
import '../data/tafsir_repository.dart';
import '../domain/mushaf_favorite_ayah.dart';
import '../domain/mushaf_page.dart';
import '../domain/mushaf_reading_position.dart';
import 'mushaf_page_builder.dart';

final mushafPageBuilderProvider = Provider<MushafPageBuilder>((ref) {
  return const MushafPageBuilder();
});

final mushafPagesProvider = FutureProvider<List<MushafPage>>((ref) async {
  final quranRepository = ref.watch(quranRepositoryProvider);
  final builder = ref.watch(mushafPageBuilderProvider);

  final ayahs = await quranRepository.getAllAyahs();

  return builder.buildPages(ayahs);
});

final tafsirRepositoryProvider = Provider<TafsirRepository>((ref) {
  return AssetsTafsirRepository();
});

final mushafLocalRepositoryProvider = Provider<MushafLocalRepository>((ref) {
  return SharedPrefsMushafLocalRepository();
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
