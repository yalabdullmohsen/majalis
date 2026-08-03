import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';
import '../domain/mushaf_page.dart';
import 'mushaf_bookmarks_screen.dart';
import 'mushaf_favorites_screen.dart';
import 'mushaf_index_screen.dart';
import 'mushaf_khatmah_screen.dart';
import 'mushaf_notes_screen.dart';
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
  bool _restoredLastPosition = false;

  @override
  void initState() {
    super.initState();
    currentPage = widget.initialPage.clamp(1, 604);
    pageController = PageController(initialPage: currentPage - 1);
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }

  void _tryRestoreLastPosition(int savedPage) {
    if (_restoredLastPosition || widget.initialPage != 1) return;
    if (savedPage <= 1) return;

    _restoredLastPosition = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !pageController.hasClients) return;
      pageController.jumpToPage((savedPage - 1).clamp(0, 603));
      setState(() => currentPage = savedPage.clamp(1, 604));
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = ref.watch(mushafPagesProvider);
    final mushafState = ref.watch(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);
    final pageItems = pages.asData?.value ?? const <MushafPage>[];

    if (!mushafState.isLoading) {
      _tryRestoreLastPosition(mushafState.currentPage);
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor:
            nightMode ? const Color(0xFF0F0C09) : Tasmee3Colors.background,
        appBar: chromeVisible
            ? AppBar(
                title: Text(
                  mushafState.selectionMode
                      ? '${mushafState.selectedAyahKeys.length} محددة'
                      : 'المصحف - صفحة $currentPage',
                ),
                centerTitle: true,
                backgroundColor: nightMode
                    ? const Color(0xFF0F0C09)
                    : Tasmee3Colors.background,
                foregroundColor: nightMode ? Colors.white : Tasmee3Colors.text,
                elevation: 0,
                leading: mushafState.selectionMode
                    ? IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: controller.clearSelection,
                      )
                    : null,
                actions: mushafState.selectionMode
                    ? [
                        IconButton(
                          tooltip: 'نسخ',
                          icon: const Icon(Icons.copy),
                          onPressed: () => _copySelectedAyahs(pageItems),
                        ),
                        IconButton(
                          tooltip: 'مشاركة',
                          icon: const Icon(Icons.share),
                          onPressed: () => _shareSelectedAyahs(pageItems),
                        ),
                      ]
                    : [
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
                              pageController
                                  .jumpToPage((selected - 1).clamp(0, 603));
                            }
                          },
                        ),
                        IconButton(
                          tooltip: nightMode ? 'الوضع النهاري' : 'الوضع الليلي',
                          icon: Icon(
                            nightMode ? Icons.light_mode : Icons.dark_mode,
                          ),
                          onPressed: () {
                            setState(() => nightMode = !nightMode);
                          },
                        ),
                        PopupMenuButton<String>(
                          onSelected: (value) {
                            final Widget? screen = switch (value) {
                              'bookmarks' => const MushafBookmarksScreen(),
                              'favorites' => const MushafFavoritesScreen(),
                              'notes' => const MushafNotesScreen(),
                              'khatmah' => const MushafKhatmahScreen(),
                              'reciters' => const MushafRecitersScreen(),
                              _ => null,
                            };

                            if (screen == null) return;
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => screen),
                            );
                          },
                          itemBuilder: (context) => const [
                            PopupMenuItem(
                              value: 'bookmarks',
                              child: Text('العلامات'),
                            ),
                            PopupMenuItem(
                              value: 'favorites',
                              child: Text('المفضلة'),
                            ),
                            PopupMenuItem(
                              value: 'notes',
                              child: Text('الملاحظات'),
                            ),
                            PopupMenuItem(
                              value: 'khatmah',
                              child: Text('الختمة'),
                            ),
                            PopupMenuItem(
                              value: 'reciters',
                              child: Text('القراء'),
                            ),
                          ],
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
                if (mushafState.selectionMode) return;
                setState(() => chromeVisible = !chromeVisible);
              },
              child: PageView.builder(
                controller: pageController,
                reverse: true,
                itemCount: items.length,
                onPageChanged: (index) {
                  final page = items[index];
                  setState(() => currentPage = page.pageNumber);
                  controller.updateReadingPosition(
                    pageNumber: page.pageNumber,
                    firstVisibleAyah:
                        page.ayahs.isEmpty ? null : page.ayahs.first,
                  );
                },
                itemBuilder: (context, index) {
                  final page = items[index];

                  return MushafPageView(
                    page: page,
                    nightMode: nightMode,
                    highlightedSurah: highlightedSurah,
                    highlightedAyah: highlightedAyah,
                    selectedAyahKeys: mushafState.selectedAyahKeys,
                    onAyahLongPress: controller.startSelection,
                    onAyahTap: (ayah) {
                      if (mushafState.selectionMode) {
                        controller.toggleSelection(ayah);
                      } else {
                        _openAyahActions(ayah);
                      }
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  List<QuranAyah> _selectedAyahsFromPages(
    List<MushafPage> pages,
    Set<String> selectedKeys,
  ) {
    final ayahs = <QuranAyah>[];

    for (final page in pages) {
      for (final ayah in page.ayahs) {
        if (selectedKeys.contains(ayah.ref.key)) {
          ayahs.add(ayah);
        }
      }
    }

    ayahs.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);
      if (surahCompare != 0) return surahCompare;
      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    return ayahs;
  }

  String _formatSelectedText(List<QuranAyah> ayahs) {
    return ayahs
        .map(
          (ayah) =>
              '${ayah.textUthmani} (${ayah.ref.surah}:${ayah.ref.ayah})',
        )
        .join('\n');
  }

  Future<void> _copySelectedAyahs(List<MushafPage> pages) async {
    final state = ref.read(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);

    final ayahs = _selectedAyahsFromPages(pages, state.selectedAyahKeys);
    if (ayahs.isEmpty) return;

    await Clipboard.setData(ClipboardData(text: _formatSelectedText(ayahs)));
    controller.clearSelection();

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم نسخ الآيات المحددة.')),
    );
  }

  Future<void> _shareSelectedAyahs(List<MushafPage> pages) async {
    final state = ref.read(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);

    final ayahs = _selectedAyahsFromPages(pages, state.selectedAyahKeys);
    if (ayahs.isEmpty) return;

    final text = _formatSelectedText(ayahs);
    await Share.share(text);
    controller.clearSelection();

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'تمت مشاركة النص. مشاركة الصورة ستُضاف لاحقا.',
        ),
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
        pageNumber: currentPage,
      ),
    );
  }
}
