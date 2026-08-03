import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../tasmee3/domain/ayah_ref.dart';
import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/domain/recitation_target.dart';
import '../../tasmee3/domain/tasmee3_launch_config.dart';
import '../../tasmee3/domain/tasmee3_launch_source.dart';
import '../../tasmee3/presentation/tasmee3_design_tokens.dart';
import '../../tasmee3/presentation/tasmee3_screen.dart';
import '../../tasmee3/presentation/widgets/tasmee3_error_state.dart';
import '../../tasmee3/presentation/widgets/tasmee3_loading_state.dart';
import '../application/mushaf_providers.dart';
import '../domain/mushaf_page.dart';
import '../domain/mushaf_reading_settings.dart';
import '../domain/mushaf_reading_theme.dart';
import '../domain/mushaf_tasmee3_last_range.dart';
import 'ayah_share_preview_screen.dart';
import 'mushaf_audio_settings_screen.dart';
import 'mushaf_bookmarks_screen.dart';
import 'mushaf_downloads_screen.dart';
import 'mushaf_favorites_screen.dart';
import 'mushaf_index_screen.dart';
import 'mushaf_khatmah_screen.dart';
import 'mushaf_notes_screen.dart';
import 'mushaf_reading_settings_screen.dart';
import 'mushaf_reading_theme_colors.dart';
import 'mushaf_reciters_screen.dart';
import 'mushaf_review_markers_screen.dart';
import 'mushaf_search_screen.dart';
import 'widgets/mushaf_ayah_actions_sheet.dart';
import 'widgets/mushaf_mini_player.dart';
import 'widgets/mushaf_page_view.dart';

/// Mushafi-branded Quran reader used from the Tasmee3 dashboard.
///
/// Distinct from the app-shell mushaf route under `features/quran`.
class MushafReaderScreen extends ConsumerStatefulWidget {
  final int initialPage;
  final int? initialHighlightedSurah;
  final int? initialHighlightedAyah;

  const MushafReaderScreen({
    super.key,
    this.initialPage = 1,
    this.initialHighlightedSurah,
    this.initialHighlightedAyah,
  });

  @override
  ConsumerState<MushafReaderScreen> createState() => _MushafReaderScreenState();
}

/// Alias matching the feature prompt name.
typedef MushafScreen = MushafReaderScreen;

class _MushafReaderScreenState extends ConsumerState<MushafReaderScreen> {
  late PageController pageController;
  bool chromeVisible = true;
  int currentPage = 1;
  int? highlightedSurah;
  int? highlightedAyah;
  bool _restoredLastPosition = false;
  bool _alignedInitialPage = false;
  bool _focusedSearchResult = false;

  @override
  void initState() {
    super.initState();
    currentPage = widget.initialPage < 1 ? 1 : widget.initialPage;
    highlightedSurah = widget.initialHighlightedSurah;
    highlightedAyah = widget.initialHighlightedAyah;
    // Align to a real index after pages/metadata load (count may be < 604).
    pageController = PageController(initialPage: 0);
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }

  int _indexForPageNumber(List<MushafPage> items, int pageNumber) {
    if (items.isEmpty) return 0;
    final exact = items.indexWhere((page) => page.pageNumber == pageNumber);
    if (exact >= 0) return exact;
    return (pageNumber - 1).clamp(0, items.length - 1);
  }

  void _jumpToPageNumber(List<MushafPage> items, int pageNumber) {
    if (items.isEmpty || !pageController.hasClients) return;
    final index = _indexForPageNumber(items, pageNumber);
    pageController.jumpToPage(index);
    setState(() => currentPage = items[index].pageNumber);
  }

  void _tryRestoreLastPosition(List<MushafPage> items, int savedPage) {
    if (_restoredLastPosition || widget.initialPage != 1) return;
    if (savedPage <= 1 || items.isEmpty) return;

    _restoredLastPosition = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _jumpToPageNumber(items, savedPage);
    });
  }

  void _alignInitialPage(List<MushafPage> items) {
    if (_alignedInitialPage || items.isEmpty) return;
    _alignedInitialPage = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _jumpToPageNumber(items, currentPage);
      _tryFocusSearchResult(items);
    });
  }

  void _tryFocusSearchResult(List<MushafPage> items) {
    if (_focusedSearchResult) return;

    final surah = widget.initialHighlightedSurah;
    final ayahNumber = widget.initialHighlightedAyah;
    if (surah == null || ayahNumber == null || items.isEmpty) return;

    _focusedSearchResult = true;

    for (final page in items) {
      final matches = page.ayahs.any(
        (ayah) =>
            ayah.ref.surah == surah && ayah.ref.ayah == ayahNumber,
      );
      if (matches) {
        _jumpToPageNumber(items, page.pageNumber);
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = ref.watch(mushafPagesProvider);
    final mushafState = ref.watch(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);
    final audioState = ref.watch(mushafAudioControllerProvider);
    final reviewMarkersAsync = ref.watch(mushafReviewMarkersProvider);
    final reviewMarkerKeys = reviewMarkersAsync.maybeWhen(
      data: (items) => items.map((item) => item.key).toSet(),
      orElse: () => <String>{},
    );
    final readingSettings =
        ref.watch(mushafReadingSettingsControllerProvider).settings;
    final themeColors =
        MushafReadingThemeColors.fromTheme(readingSettings.theme);
    final pageItems = pages.asData?.value ?? const <MushafPage>[];

    final activeSurah = audioState.currentSurah ?? highlightedSurah;
    final activeAyah = audioState.currentAyah ?? highlightedAyah;

    ref.listen(mushafAudioControllerProvider, (previous, next) {
      final shouldScroll = ref
              .read(mushafAudioSettingsProvider)
              .asData
              ?.value
              .autoScrollToPlayingAyah ??
          true;

      if (!shouldScroll) return;
      if (next.currentSurah == null || next.currentAyah == null) return;
      if (previous?.currentSurah == next.currentSurah &&
          previous?.currentAyah == next.currentAyah) {
        return;
      }

      final items = ref.read(mushafPagesProvider).asData?.value;
      if (items == null || items.isEmpty) return;

      for (final page in items) {
        final matches = page.ayahs.any(
          (ayah) =>
              ayah.ref.surah == next.currentSurah &&
              ayah.ref.ayah == next.currentAyah,
        );
        if (matches) {
          _jumpToPageNumber(items, page.pageNumber);
          break;
        }
      }
    });

    if (pageItems.isNotEmpty) {
      _alignInitialPage(pageItems);
      if (!mushafState.isLoading) {
        _tryRestoreLastPosition(pageItems, mushafState.currentPage);
      }
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: themeColors.scaffold,
        appBar: chromeVisible
            ? AppBar(
                title: Text(
                  mushafState.selectionMode
                      ? '${mushafState.selectedAyahKeys.length} محددة'
                      : 'المصحف - صفحة $currentPage',
                ),
                centerTitle: true,
                backgroundColor: themeColors.scaffold,
                foregroundColor: themeColors.text,
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
                          tooltip: 'تسميع',
                          icon: const Icon(Icons.mic_none_outlined),
                          onPressed: () =>
                              _openTasmee3ForSelectedAyahs(pageItems),
                        ),
                        IconButton(
                          tooltip: 'تشغيل',
                          icon: const Icon(Icons.play_arrow),
                          onPressed: () => _playSelectedAyahs(pageItems),
                        ),
                        IconButton(
                          tooltip: 'تنزيل',
                          icon: const Icon(Icons.download_outlined),
                          onPressed: () => _downloadSelectedAyahs(pageItems),
                        ),
                        IconButton(
                          tooltip: 'نسخ',
                          icon: const Icon(Icons.copy),
                          onPressed: () => _copySelectedAyahs(pageItems),
                        ),
                        IconButton(
                          tooltip: 'مشاركة كصورة',
                          icon: const Icon(Icons.image_outlined),
                          onPressed: () =>
                              _openShareImageForSelected(pageItems),
                        ),
                        IconButton(
                          tooltip: 'مشاركة',
                          icon: const Icon(Icons.share),
                          onPressed: () => _shareSelectedAyahs(pageItems),
                        ),
                      ]
                    : [
                        IconButton(
                          tooltip: 'بحث',
                          icon: const Icon(Icons.search),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const MushafSearchScreen(),
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

                            if (selected != null) {
                              _jumpToPageNumber(pageItems, selected);
                            }
                          },
                        ),
                        IconButton(
                          tooltip: readingSettings.theme.isDark
                              ? 'الوضع النهاري'
                              : 'الوضع الليلي',
                          icon: Icon(
                            readingSettings.theme.isDark
                                ? Icons.light_mode
                                : Icons.dark_mode,
                          ),
                          onPressed: () => _toggleReadingTheme(readingSettings),
                        ),
                        IconButton(
                          tooltip: 'إعدادات القراءة',
                          icon: const Icon(Icons.text_fields),
                          onPressed: _openReadingSettings,
                        ),
                        PopupMenuButton<String>(
                          onSelected: (value) async {
                            if (value == 'reading_settings') {
                              await _openReadingSettings();
                              return;
                            }

                            if (value == 'audioSettings') {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const MushafAudioSettingsScreen(),
                                ),
                              );
                              ref.invalidate(mushafAudioSettingsProvider);
                              return;
                            }

                            if (value == 'playPage') {
                              await _playCurrentPage(pageItems);
                              return;
                            }

                            if (value == 'downloadPage') {
                              await _downloadCurrentPage(pageItems);
                              return;
                            }

                            if (value == 'downloads') {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const MushafDownloadsScreen(),
                                ),
                              );
                              return;
                            }

                            if (value == 'markPageRead') {
                              await ref
                                  .read(khatmahPlanControllerProvider.notifier)
                                  .markPagesRead(
                                    fromPage: currentPage,
                                    toPage: currentPage,
                                  );

                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'تم تسجيل الصفحة في الختمة.',
                                    ),
                                  ),
                                );
                              }
                              return;
                            }

                            if (value == 'reviewMarkers') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const MushafReviewMarkersScreen(),
                                ),
                              );
                              return;
                            }

                            if (value == 'lastTasmee3Range') {
                              final range = await ref
                                  .read(mushafLocalRepositoryProvider)
                                  .getLastTasmee3Range();

                              if (range == null) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'لا يوجد نطاق تسميع محفوظ بعد.',
                                      ),
                                    ),
                                  );
                                }
                                return;
                              }

                              final target = RecitationTarget(
                                from: AyahRef(
                                  surah: range.fromSurah,
                                  ayah: range.fromAyah,
                                ),
                                to: AyahRef(
                                  surah: range.toSurah,
                                  ayah: range.toAyah,
                                ),
                                mode: Tasmee3Mode.hifzTest,
                              );

                              if (context.mounted) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => Tasmee3Screen(
                                      launchConfig: Tasmee3LaunchConfig(
                                        initialTarget: target,
                                        source: Tasmee3LaunchSource.mushaf,
                                        showSourceBanner: true,
                                        returnToMushafAfterCompletion: true,
                                      ),
                                    ),
                                  ),
                                );
                              }
                              return;
                            }

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
                              value: 'reading_settings',
                              child: Text('إعدادات القراءة'),
                            ),
                            PopupMenuItem(
                              value: 'audioSettings',
                              child: Text('إعدادات الصوت'),
                            ),
                            PopupMenuItem(
                              value: 'playPage',
                              child: Text('تشغيل الصفحة'),
                            ),
                            PopupMenuItem(
                              value: 'downloadPage',
                              child: Text('تنزيل الصفحة'),
                            ),
                            PopupMenuItem(
                              value: 'downloads',
                              child: Text('تنزيلات الصوت'),
                            ),
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
                              value: 'markPageRead',
                              child: Text('تسجيل قراءة الصفحة'),
                            ),
                            PopupMenuItem(
                              value: 'lastTasmee3Range',
                              child: Text('آخر نطاق تسميع'),
                            ),
                            PopupMenuItem(
                              value: 'reviewMarkers',
                              child: Text('مواضع المراجعة'),
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
                    readingSettings: readingSettings,
                    highlightedSurah: activeSurah,
                    highlightedAyah: activeAyah,
                    forceHighlight:
                        activeSurah != null && activeAyah != null,
                    selectedAyahKeys: mushafState.selectedAyahKeys,
                    reviewMarkerKeys: reviewMarkerKeys,
                    onAyahLongPress: controller.startSelection,
                    onAyahTap: (ayah) {
                      if (mushafState.selectionMode) {
                        controller.toggleSelection(ayah);
                      } else {
                        _openAyahActions(ayah, readingSettings);
                      }
                    },
                  );
                },
              ),
            );
          },
        ),
        bottomNavigationBar: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _downloadProgressBar(),
            const MushafMiniPlayer(),
          ],
        ),
      ),
    );
  }

  Widget _downloadProgressBar() {
    final downloadState = ref.watch(mushafAudioDownloadControllerProvider);

    if (!downloadState.isDownloading) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(10),
      color: Tasmee3Colors.surface,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          LinearProgressIndicator(value: downloadState.progress),
          const SizedBox(height: 6),
          Text(
            'جاري التنزيل ${downloadState.completed} من ${downloadState.total}',
            style: Tasmee3TextStyles.secondary,
          ),
        ],
      ),
    );
  }

  MushafPage? _pageByNumber(List<MushafPage> pages, int pageNumber) {
    for (final page in pages) {
      if (page.pageNumber == pageNumber) return page;
    }
    return null;
  }

  String _errorMessage(Object error) {
    if (error is StateError) return error.message;
    return error.toString();
  }

  Future<void> _openTasmee3ForSelectedAyahs(List<MushafPage> pages) async {
    final state = ref.read(mushafControllerProvider);

    final ayahs = _selectedAyahsFromPages(
      pages,
      state.selectedAyahKeys,
    );

    if (ayahs.isEmpty) {
      return;
    }

    if (ayahs.length > 10) {
      if (!mounted) return;

      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              title: const Text('نطاق طويل'),
              content: const Text(
                'النطاق المحدد طويل. للحصول على نتيجة أدق في التسميع، يفضّل اختيار نطاق أقصر.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('إلغاء'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(dialogContext);
                    _pushTasmee3ForAyahs(ayahs);
                  },
                  child: const Text('المتابعة'),
                ),
              ],
            ),
          );
        },
      );

      return;
    }

    await _pushTasmee3ForAyahs(ayahs);
  }

  Future<void> _pushTasmee3ForAyahs(List<QuranAyah> ayahs) async {
    final controller = ref.read(mushafControllerProvider.notifier);
    final mapper = ref.read(mushafToTasmee3TargetMapperProvider);
    final target = mapper.fromAyahs(ayahs);

    if (!target.isValid) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'التسميع حالياً لنطاق داخل سورة واحدة فقط.',
          ),
        ),
      );
      return;
    }

    final first = ayahs.first;
    final last = ayahs.last;

    await ref.read(mushafLocalRepositoryProvider).saveLastTasmee3Range(
          MushafTasmee3LastRange(
            fromSurah: first.ref.surah,
            fromAyah: first.ref.ayah,
            toSurah: last.ref.surah,
            toAyah: last.ref.ayah,
            updatedAt: DateTime.now(),
          ),
        );

    controller.clearSelection();

    if (!mounted) return;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Tasmee3Screen(
          launchConfig: Tasmee3LaunchConfig(
            initialTarget: target,
            source: Tasmee3LaunchSource.mushaf,
            showSourceBanner: true,
            returnToMushafAfterCompletion: true,
          ),
        ),
      ),
    );
  }

  Future<void> _playSelectedAyahs(List<MushafPage> pages) async {
    final state = ref.read(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);
    final audio = ref.read(mushafAudioControllerProvider.notifier);

    final ayahs = _selectedAyahsFromPages(
      pages,
      state.selectedAyahKeys,
    );

    if (ayahs.isEmpty) return;

    controller.clearSelection();
    await audio.playRange(ayahs);
  }

  Future<void> _downloadSelectedAyahs(List<MushafPage> pages) async {
    final state = ref.read(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);
    final settingsRepository = ref.read(mushafAudioSettingsRepositoryProvider);
    final settings = await settingsRepository.load();

    final ayahs = _selectedAyahsFromPages(
      pages,
      state.selectedAyahKeys,
    );

    if (ayahs.isEmpty) return;

    controller.clearSelection();

    try {
      await ref.read(mushafAudioDownloadControllerProvider.notifier).downloadAyahs(
            reciterId: settings.reciterId,
            ayahs: ayahs,
          );

      ref.invalidate(mushafAudioDownloadsProvider);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تنزيل الصوت المحدد.')),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر التنزيل: ${_errorMessage(e)}')),
      );
    }
  }

  Future<void> _playCurrentPage(List<MushafPage> pages) async {
    final page = _pageByNumber(pages, currentPage);
    if (page == null || page.ayahs.isEmpty) return;

    await ref.read(mushafAudioControllerProvider.notifier).playRange(page.ayahs);
  }

  Future<void> _downloadCurrentPage(List<MushafPage> pages) async {
    final page = _pageByNumber(pages, currentPage);
    if (page == null || page.ayahs.isEmpty) return;

    final settingsRepository = ref.read(mushafAudioSettingsRepositoryProvider);
    final settings = await settingsRepository.load();

    try {
      await ref.read(mushafAudioDownloadControllerProvider.notifier).downloadAyahs(
            reciterId: settings.reciterId,
            ayahs: page.ayahs,
          );

      ref.invalidate(mushafAudioDownloadsProvider);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تنزيل صوت الصفحة.')),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر تنزيل الصفحة: ${_errorMessage(e)}')),
      );
    }
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

  void _openShareImageForSelected(List<MushafPage> pages) {
    final state = ref.read(mushafControllerProvider);
    final controller = ref.read(mushafControllerProvider.notifier);

    final ayahs = _selectedAyahsFromPages(
      pages,
      state.selectedAyahKeys,
    );

    if (ayahs.isEmpty) return;

    controller.clearSelection();

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AyahSharePreviewScreen(
          ayahs: ayahs,
        ),
      ),
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

  Future<void> _openReadingSettings() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const MushafReadingSettingsScreen(),
      ),
    );

    await ref.read(mushafReadingSettingsControllerProvider.notifier).load();
    ref.invalidate(mushafReadingSettingsProvider);
  }

  Future<void> _toggleReadingTheme(MushafReadingSettings current) async {
    final nextTheme = current.theme.isDark
        ? MushafReadingTheme.sepia
        : MushafReadingTheme.night;
    final updated = current.copyWith(theme: nextTheme);
    final settingsController =
        ref.read(mushafReadingSettingsControllerProvider.notifier);

    settingsController.update(updated);
    await settingsController.save();
    ref.invalidate(mushafReadingSettingsProvider);
  }

  void _openAyahActions(
    QuranAyah ayah,
    MushafReadingSettings readingSettings,
  ) {
    setState(() {
      highlightedSurah = ayah.ref.surah;
      highlightedAyah = ayah.ref.ayah;
    });

    final themeColors =
        MushafReadingThemeColors.fromTheme(readingSettings.theme);

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      backgroundColor: themeColors.page,
      builder: (_) => MushafAyahActionsSheet(
        ayah: ayah,
        nightMode: readingSettings.theme.isDark,
        pageNumber: currentPage,
      ),
    );
  }
}
