import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mushaf_search_history_repository.dart';
import '../domain/mushaf_search_filter.dart';
import '../domain/mushaf_search_index_item.dart';
import '../domain/mushaf_search_result.dart';
import 'mushaf_search_service.dart';

class MushafSearchState {
  final String query;
  final List<MushafSearchResult> results;
  final bool isSearching;
  final String? errorMessage;
  final MushafSearchFilter filter;

  const MushafSearchState({
    this.query = '',
    this.results = const [],
    this.isSearching = false,
    this.errorMessage,
    this.filter = const MushafSearchFilter.defaults(),
  });

  MushafSearchState copyWith({
    String? query,
    List<MushafSearchResult>? results,
    bool? isSearching,
    String? errorMessage,
    MushafSearchFilter? filter,
  }) {
    return MushafSearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isSearching: isSearching ?? this.isSearching,
      errorMessage: errorMessage,
      filter: filter ?? this.filter,
    );
  }
}

class MushafSearchController extends StateNotifier<MushafSearchState> {
  final Future<List<MushafSearchIndexItem>> Function() loadIndex;
  final MushafSearchService searchService;
  final MushafSearchHistoryRepository historyRepository;

  MushafSearchController({
    required this.loadIndex,
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

  void updateFilter(MushafSearchFilter filter) {
    state = state.copyWith(filter: filter);

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
    );

    try {
      final index = await loadIndex();

      final results = await searchService.searchIndex(
        index: index,
        query: cleaned,
        filter: state.filter,
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
