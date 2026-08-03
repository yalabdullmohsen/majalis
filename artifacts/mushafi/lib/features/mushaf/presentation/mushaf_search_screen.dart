import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../application/mushaf_providers.dart';
import '../application/mushaf_search_controller.dart';
import '../data/tafsir_catalog.dart';
import '../domain/mushaf_search_filter.dart';
import '../domain/mushaf_search_history_item.dart';
import '../domain/mushaf_search_result.dart';
import 'mushaf_design_tokens.dart';
import 'mushaf_screen.dart';
import 'mushaf_search_filter_sheet.dart';
import 'mushaf_tafsir_screen.dart';
import 'widgets/search_highlighted_ayah_text.dart';

class MushafSearchScreen extends ConsumerStatefulWidget {
  const MushafSearchScreen({super.key});

  @override
  ConsumerState<MushafSearchScreen> createState() => _MushafSearchScreenState();
}

class _MushafSearchScreenState extends ConsumerState<MushafSearchScreen> {
  final TextEditingController searchController = TextEditingController();

  static const _fallbackSuggestions = [
    'الله',
    'الرحمن',
    'الصبر',
    'التقوى',
    'الصلاة',
    'الجنة',
    'النار',
    'المؤمنون',
  ];

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  String _filterLabel(MushafSearchFilter filter) {
    final parts = <String>[];

    if (filter.surah != null) {
      parts.add('سورة ${filter.surah}');
    }

    if (filter.juz != null) {
      parts.add('جزء ${filter.juz}');
    }

    if (filter.includeTafsir) {
      parts.add('يشمل التفسير');
    }

    if (parts.isEmpty) {
      return 'البحث في كامل القرآن';
    }

    return parts.join(' - ');
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(mushafSearchControllerProvider);
    final searchNotifier = ref.read(mushafSearchControllerProvider.notifier);
    final history = ref.watch(mushafSearchHistoryProvider);
    final suggestions = ref.watch(mushafSearchSuggestionsProvider);

    ref.listen(mushafSearchControllerProvider, (previous, next) {
      if (previous?.isSearching == true &&
          !next.isSearching &&
          next.query.isNotEmpty) {
        ref.invalidate(mushafSearchHistoryProvider);
      }
    });

    final quickSuggestions =
        suggestions.asData?.value.take(12).toList() ?? _fallbackSuggestions;

    return Tasmee3AppScaffold(
      title: 'البحث في القرآن',
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              MushafSpacing.lg,
              MushafSpacing.lg,
              MushafSpacing.lg,
              MushafSpacing.sm,
            ),
            child: Container(
              padding: const EdgeInsets.all(MushafSpacing.md),
              decoration: BoxDecoration(
                color: MushafColors.surface,
                borderRadius: BorderRadius.circular(MushafRadius.lg),
                border: Border.all(color: MushafColors.border),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: searchController,
                    textDirection: TextDirection.rtl,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'ابحث عن كلمة أو جزء من آية',
                      prefixIcon: const Icon(
                        Icons.search,
                        color: MushafColors.primary,
                      ),
                      suffixIcon: searchController.text.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () {
                                searchController.clear();
                                searchNotifier.updateQuery('');
                                setState(() {});
                              },
                            ),
                      filled: true,
                      fillColor: MushafColors.paper,
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(MushafRadius.md),
                        borderSide: const BorderSide(
                          color: MushafColors.border,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(MushafRadius.md),
                        borderSide: const BorderSide(
                          color: MushafColors.border,
                        ),
                      ),
                    ),
                    onChanged: (value) {
                      searchNotifier.updateQuery(value);
                      setState(() {});
                    },
                    onSubmitted: (value) {
                      searchNotifier.search(value);
                    },
                  ),
                  const SizedBox(height: MushafSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _filterLabel(searchState.filter),
                          style: MushafTextStyles.secondary,
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final selected =
                              await showModalBottomSheet<MushafSearchFilter>(
                            context: context,
                            showDragHandle: true,
                            isScrollControlled: true,
                            builder: (_) => MushafSearchFilterSheet(
                              current: searchState.filter,
                            ),
                          );

                          if (selected != null) {
                            ref
                                .read(mushafSearchControllerProvider.notifier)
                                .updateFilter(selected);
                          }
                        },
                        icon: const Icon(Icons.filter_list),
                        label: const Text('فلترة'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (searchController.text.trim().isEmpty)
            Expanded(
              child: _IdleSearchContent(
                quickSuggestions: quickSuggestions,
                history: history,
                onQuery: (query) {
                  searchController.text = query;
                  searchController.selection = TextSelection.collapsed(
                    offset: query.length,
                  );
                  searchNotifier.search(query);
                  setState(() {});
                },
                onClearHistory: () async {
                  await searchNotifier.clearHistory();
                  ref.invalidate(mushafSearchHistoryProvider);
                },
              ),
            )
          else
            Expanded(
              child: _SearchResultsContent(
                state: searchState,
              ),
            ),
        ],
      ),
    );
  }
}

class _IdleSearchContent extends StatelessWidget {
  final List<String> quickSuggestions;
  final AsyncValue<List<MushafSearchHistoryItem>> history;
  final ValueChanged<String> onQuery;
  final VoidCallback onClearHistory;

  const _IdleSearchContent({
    required this.quickSuggestions,
    required this.history,
    required this.onQuery,
    required this.onClearHistory,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        Tasmee3Spacing.lg,
        0,
        Tasmee3Spacing.lg,
        Tasmee3Spacing.lg,
      ),
      children: [
        const Text(
          'اقتراحات سريعة',
          style: Tasmee3TextStyles.sectionTitle,
        ),
        const SizedBox(height: Tasmee3Spacing.md),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: quickSuggestions.map((item) {
            return ActionChip(
              label: Text(item),
              onPressed: () => onQuery(item),
            );
          }).toList(),
        ),
        const SizedBox(height: Tasmee3Spacing.xl),
        Row(
          children: [
            const Expanded(
              child: Text(
                'عمليات البحث الأخيرة',
                style: Tasmee3TextStyles.sectionTitle,
              ),
            ),
            TextButton(
              onPressed: onClearHistory,
              child: const Text('مسح'),
            ),
          ],
        ),
        const SizedBox(height: Tasmee3Spacing.sm),
        history.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Text(
            error.toString(),
            style: const TextStyle(color: Tasmee3Colors.danger),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Text(
                'لا يوجد سجل بحث بعد.',
                style: Tasmee3TextStyles.secondary,
              );
            }

            return Column(
              children: [
                for (final item in items)
                  ListTile(
                    leading: const Icon(Icons.history),
                    title: Text(item.query),
                    onTap: () => onQuery(item.query),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _SearchResultsContent extends StatelessWidget {
  final MushafSearchState state;

  const _SearchResultsContent({
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    if (state.isSearching) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null) {
      return Tasmee3ErrorState(message: state.errorMessage!);
    }

    if (state.results.isEmpty) {
      return Tasmee3EmptyState(
        icon: Icons.search_off,
        title: state.infoMessage != null
            ? 'التفسير غير متوفر'
            : 'لا توجد نتائج',
        message: state.infoMessage ??
            'جرّب كلمة أخرى أو اكتب جزءا أقصر من الآية.',
      );
    }

    final results = state.results;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Tasmee3Spacing.lg),
          child: Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${results.length} نتيجة',
              style: Tasmee3TextStyles.secondary,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            itemCount: results.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final result = results[index];

              return _SearchResultCard(result: result);
            },
          ),
        ),
      ],
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final MushafSearchResult result;

  const _SearchResultCard({
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final isTafsir = result.source == MushafSearchResultSource.tafsir;

    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.md),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MushafScreen(
                    initialPage: result.pageNumber,
                    initialHighlightedSurah: result.ayah.ref.surah,
                    initialHighlightedAyah: result.ayah.ref.ayah,
                  ),
                ),
              );
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'سورة ${result.ayah.ref.surah} - آية ${result.ayah.ref.ayah} - صفحة ${result.pageNumber}',
                        style: Tasmee3TextStyles.secondary.copyWith(
                          color: Tasmee3Colors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isTafsir
                            ? Tasmee3Colors.info.withValues(alpha: 0.12)
                            : Tasmee3Colors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        isTafsir ? 'نتيجة من التفسير' : 'نتيجة من القرآن',
                        style:
                            Tasmee3TextStyles.secondary.copyWith(fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SearchHighlightedAyahText(
                  text: result.snippet,
                  query: result.query,
                ),
                if (isTafsir && result.tafsirSnippet != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(Tasmee3Spacing.md),
                    decoration: BoxDecoration(
                      color: Tasmee3Colors.background,
                      borderRadius: BorderRadius.circular(Tasmee3Radius.md),
                      border: Border.all(color: Tasmee3Colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          result.tafsirSourceName ?? 'التفسير',
                          style: Tasmee3TextStyles.secondary.copyWith(
                            color: Tasmee3Colors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        SearchHighlightedAyahText(
                          text: result.tafsirSnippet!,
                          query: result.query,
                          style: Tasmee3TextStyles.body,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isTafsir) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => MushafTafsirScreen(
                        ayah: result.ayah,
                        source: TafsirCatalog.defaultSource(),
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.menu_book_outlined),
                label: const Text('فتح التفسير'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
