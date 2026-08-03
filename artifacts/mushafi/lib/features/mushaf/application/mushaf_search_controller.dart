import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mushaf_search_history_repository.dart';
import '../domain/mushaf_search_filter.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/mushaf_search_result.dart';
import '../domain/tafsir_search_index_item.dart';
import 'mushaf_search_service.dart';

class MushafSearchState {
  final String query;
  final List<MushafSearchResult> results;
  final bool isSearching;
  final String? errorMessage;
  final String? infoMessage;
  final MushafSearchFilter filter;

  const MushafSearchState({
    this.query = '',
    this.results = const [],
    this.isSearching = false,
    this.errorMessage,
    this.infoMessage,
    this.filter = const MushafSearchFilter.defaults(),
  });

  MushafSearchState copyWith({
    String? query,
    List<MushafSearchResult>? results,
    bool? isSearching,
    String? errorMessage,
    String? infoMessage,
    bool clearInfoMessage = false,
    MushafSearchFilter? filter,
  }) {
    return MushafSearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isSearching: isSearching ?? this.isSearching,
      errorMessage: errorMessage,
      infoMessage:
          clearInfoMessage ? null : infoMessage ?? this.infoMessage,
      filter: filter ?? this.filter,
    );
  }
}

class MushafSearchController extends StateNotifier<MushafSearchState> {
  final Future<List<MushafSearchIndexItem>> Function() loadIndex;
  final Future<List<TafsirSearchIndexItem>> Function() loadTafsirIndex;
  final MushafSearchService searchService;
  final MushafSearchHistoryRepository historyRepository;

  MushafSearchController({
    required this.loadIndex,
    required this.loadTafsirIndex,
    required this.searchService,
    required this.historyRepository,
  }) : super(const MushafSearchState());

  Timer? _debounce;

  void updateQuery(String query) {
    state = state.copyWith(
      query: query,
      errorMessage: null,
      clearInfoMessage: true,
    );

    _debounce?.cancel();

    _debounce = Timer(const Duration(milliseconds: 350), () {
      unawaited(search(query));
    });
  }

  void updateFilter(MushafSearchFilter filter) {
    state = state.copyWith(filter: filter, clearInfoMessage: true);

    if (state.query.trim().isNotEmpty) {
      unawaited(search(state.query));
    }
  }

  Future<void> search(String query) async {
    final cleaned = query.trim();

    if (cleaned.isEmpty) {
      state = MushafSearchState(filter: state.filter);
      return;
    }

    state = state.copyWith(
      query: cleaned,
      isSearching: true,
      errorMessage: null,
      clearInfoMessage: true,
    );

    try {
      final quranIndex = await loadIndex();

      var tafsirIndex = const <TafsirSearchIndexItem>[];

      if (state.filter.includeTafsir) {
        try {
          tafsirIndex = await loadTafsirIndex();
        } catch (_) {
          tafsirIndex = const [];
        }
      }

      if (state.filter.includeTafsir &&
          !state.filter.includeQuranText &&
          tafsirIndex.isEmpty) {
        await historyRepository.add(cleaned);

        state = state.copyWith(
          query: cleaned,
          results: const [],
          isSearching: false,
          infoMessage:
              'ملف التفسير غير متوفر أو فارغ. لا يمكن البحث في التفسير حالياً.',
        );
        return;
      }

      final results = await searchService.searchCombined(
        quranIndex: quranIndex,
        tafsirIndex: tafsirIndex,
        query: cleaned,
        filter: state.filter,
      );

      await historyRepository.add(cleaned);

      state = state.copyWith(
        query: cleaned,
        results: results,
        isSearching: false,
        clearInfoMessage: true,
      );
    } catch (e) {
      state = state.copyWith(
        isSearching: false,
        errorMessage: e.toString(),
        clearInfoMessage: true,
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
