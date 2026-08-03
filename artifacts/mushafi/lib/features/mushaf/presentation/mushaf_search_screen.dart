import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../../tasmee3/presentation/widgets/tasmee3_empty_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../application/mushaf_providers.dart';
import '../application/mushaf_search_controller.dart';
import '../domain/mushaf_search_history_item.dart';
import '../domain/mushaf_search_result.dart';
import 'mushaf_screen.dart';

class MushafSearchScreen extends ConsumerStatefulWidget {
  const MushafSearchScreen({super.key});

  @override
  ConsumerState<MushafSearchScreen> createState() => _MushafSearchScreenState();
}

class _MushafSearchScreenState extends ConsumerState<MushafSearchScreen> {
  final TextEditingController searchController = TextEditingController();

  final quickSuggestions = const [
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

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(mushafSearchControllerProvider);
    final searchNotifier = ref.read(mushafSearchControllerProvider.notifier);
    final history = ref.watch(mushafSearchHistoryProvider);

    ref.listen(mushafSearchControllerProvider, (previous, next) {
      if (previous?.isSearching == true &&
          !next.isSearching &&
          next.query.isNotEmpty) {
        ref.invalidate(mushafSearchHistoryProvider);
      }
    });

    return Tasmee3AppScaffold(
      title: 'البحث في القرآن',
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(Tasmee3Spacing.lg),
            child: TextField(
              controller: searchController,
              textDirection: TextDirection.rtl,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'ابحث عن كلمة أو جزء من آية',
                prefixIcon: const Icon(Icons.search),
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
                border: const OutlineInputBorder(),
              ),
              onChanged: (value) {
                searchNotifier.updateQuery(value);
                setState(() {});
              },
              onSubmitted: (value) {
                searchNotifier.search(value);
              },
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
      return const Tasmee3EmptyState(
        icon: Icons.search_off,
        title: 'لا توجد نتائج',
        message: 'جرّب كلمة أخرى أو اكتب جزءا أقصر من الآية.',
      );
    }

    final results = state.results;

    return ListView.separated(
      padding: const EdgeInsets.all(Tasmee3Spacing.lg),
      itemCount: results.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final result = results[index];

        return _SearchResultCard(result: result);
      },
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
    return Container(
      padding: const EdgeInsets.all(Tasmee3Spacing.md),
      decoration: BoxDecoration(
        color: Tasmee3Colors.surface,
        borderRadius: BorderRadius.circular(Tasmee3Radius.lg),
        border: Border.all(color: Tasmee3Colors.border),
      ),
      child: InkWell(
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
            Text(
              'سورة ${result.ayah.ref.surah} - آية ${result.ayah.ref.ayah} - صفحة ${result.pageNumber}',
              style: Tasmee3TextStyles.secondary.copyWith(
                color: Tasmee3Colors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              result.snippet,
              textAlign: TextAlign.right,
              style: Tasmee3TextStyles.arabicAyah.copyWith(fontSize: 22),
            ),
          ],
        ),
      ),
    );
  }
}
