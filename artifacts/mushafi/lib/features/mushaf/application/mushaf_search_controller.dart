import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/data/quran_repository.dart';
import '../data/mushaf_search_history_repository.dart';
import '../domain/mushaf_search_result.dart';
import 'mushaf_search_service.dart';

class MushafSearchState {
  final String query;
  final List<MushafSearchResult> results;
  final bool isSearching;
  final String? errorMessage;

  const MushafSearchState({
    this.query = '',
    this.results = const [],
    this.isSearching = false,
    this.errorMessage,
  });

  MushafSearchState copyWith({
    String? query,
    List<MushafSearchResult>? results,
    bool? isSearching,
    String? errorMessage,
  }) {
    return MushafSearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isSearching: isSearching ?? this.isSearching,
      errorMessage: errorMessage,
    );
  }
}

class MushafSearchController extends StateNotifier<MushafSearchState> {
  final QuranRepository quranRepository;
  final MushafSearchService searchService;
  final MushafSearchHistoryRepository historyRepository;

  MushafSearchController({
    required this.quranRepository,
    required this.searchService,
    required this.historyRepository,
  }) : super(const MushafSearchState());

  Timer? _debounce;

  void updateQuery(String query) {
    state = state.copyWith(query: query, errorMessage: null);

    _debounce?.cancel();

    _debounce = Timer(const Duration(milliseconds: 350), () {
      unawaited(search(query));
    });
  }

  Future<void> search(String query) async {
    final cleaned = query.trim();

    if (cleaned.isEmpty) {
      state = const MushafSearchState();
      return;
    }

    state = state.copyWith(
      query: cleaned,
      isSearching: true,
      errorMessage: null,
    );

    try {
      final ayahs = await quranRepository.getAllAyahs();

      final results = await searchService.search(
        ayahs: ayahs,
        query: cleaned,
      );

      await historyRepository.add(cleaned);

      state = state.copyWith(
        query: cleaned,
        results: results,
        isSearching: false,
      );
    } catch (e) {
      state = state.copyWith(
        isSearching: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> clearHistory() async {
    await historyRepository.clear();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
