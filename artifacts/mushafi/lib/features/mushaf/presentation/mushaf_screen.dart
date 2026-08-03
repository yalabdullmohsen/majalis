import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';
import '../domain/mushaf_reading_position.dart';
import 'mushaf_index_screen.dart';
import 'mushaf_reciters_screen.dart';
import 'widgets/mushaf_ayah_actions_sheet.dart';
import 'widgets/mushaf_page_view.dart';

/// Mushafi-branded Quran reader used from the Tasmee3 dashboard.
///
/// Distinct from the app-shell mushaf route under `features/quran`.
class MushafReaderScreen extends ConsumerStatefulWidget {
  final int initialPage;

  const MushafReaderScreen({
    super.key,
    this.initialPage = 1,
  });

  @override
  ConsumerState<MushafReaderScreen> createState() => _MushafReaderScreenState();
}

/// Alias matching the feature prompt name.
typedef MushafScreen = MushafReaderScreen;

class _MushafReaderScreenState extends ConsumerState<MushafReaderScreen> {
  late PageController pageController;
  bool nightMode = false;
  bool chromeVisible = true;
  int currentPage = 1;
  int? highlightedSurah;
  int? highlightedAyah;

  @override
  void initState() {
    super.initState();
    currentPage = widget.initialPage.clamp(1, 604);
    pageController = PageController(initialPage: currentPage - 1);

    if (widget.initialPage == 1) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _restoreLastPosition();
      });
    }
  }

  Future<void> _restoreLastPosition() async {
    final position =
        await ref.read(mushafLocalRepositoryProvider).getLastPosition();
    if (!mounted || position == null) return;

    final target = position.pageNumber.clamp(1, 604);
    if (pageController.hasClients) {
      pageController.jumpToPage(target - 1);
    }
    setState(() => currentPage = target);
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = ref.watch(mushafPagesProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor:
            nightMode ? const Color(0xFF0F0C09) : Tasmee3Colors.background,
        appBar: chromeVisible
            ? AppBar(
                title: Text('المصحف - صفحة $currentPage'),
                centerTitle: true,
                backgroundColor: nightMode
                    ? const Color(0xFF0F0C09)
                    : Tasmee3Colors.background,
                foregroundColor: nightMode ? Colors.white : Tasmee3Colors.text,
                elevation: 0,
                actions: [
                  IconButton(
                    tooltip: 'القراء',
                    icon: const Icon(Icons.record_voice_over_outlined),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MushafRecitersScreen(),
                        ),
                      );
                    },
                  ),
                  IconButton(
                    tooltip: 'الفهرس',
                    icon: const Icon(Icons.list_alt),
                    onPressed: () async {
                      final selected = await Navigator.push<int>(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MushafIndexScreen(),
                        ),
                      );

                      if (selected != null && pageController.hasClients) {
                        pageController.jumpToPage((selected - 1).clamp(0, 603));
                      }
                    },
                  ),
                  IconButton(
                    tooltip: nightMode ? 'الوضع النهاري' : 'الوضع الليلي',
                    icon: Icon(nightMode ? Icons.light_mode : Icons.dark_mode),
                    onPressed: () {
                      setState(() => nightMode = !nightMode);
                    },
                  ),
                ],
              )
            : null,
        body: pages.when(
          loading: () => const Tasmee3LoadingState(
            message: 'جاري تحميل المصحف...',
          ),
          error: (error, stackTrace) => Tasmee3ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(mushafPagesProvider),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Center(
                child: Text('لا توجد صفحات مصحف متاحة.'),
              );
            }

            return GestureDetector(
              onTap: () {
                setState(() => chromeVisible = !chromeVisible);
              },
              child: PageView.builder(
                controller: pageController,
                reverse: true,
                itemCount: items.length,
                onPageChanged: (index) {
                  final page = items[index];
                  setState(() => currentPage = page.pageNumber);
                  _persistPosition(page.pageNumber, page.ayahs);
                },
                itemBuilder: (context, index) {
                  final page = items[index];

                  return MushafPageView(
                    page: page,
                    nightMode: nightMode,
                    highlightedSurah: highlightedSurah,
                    highlightedAyah: highlightedAyah,
                    onAyahTap: _openAyahActions,
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _persistPosition(int pageNumber, List<QuranAyah> ayahs) async {
    if (ayahs.isEmpty) return;

    final first = ayahs.first;
    await ref.read(mushafLocalRepositoryProvider).saveLastPosition(
          MushafReadingPosition(
            pageNumber: pageNumber,
            surah: first.ref.surah,
            ayah: first.ref.ayah,
            updatedAt: DateTime.now(),
          ),
        );
  }

  void _openAyahActions(QuranAyah ayah) {
    setState(() {
      highlightedSurah = ayah.ref.surah;
      highlightedAyah = ayah.ref.ayah;
    });

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      backgroundColor:
          nightMode ? const Color(0xFF1B1611) : Tasmee3Colors.surface,
      builder: (_) => MushafAyahActionsSheet(
        ayah: ayah,
        nightMode: nightMode,
      ),
    );
  }
}
