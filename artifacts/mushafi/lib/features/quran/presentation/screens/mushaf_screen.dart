import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/widgets/app_bottom_sheet.dart';
import 'package:mushafi/features/audio/presentation/widgets/mini_player.dart';
import 'package:mushafi/features/audio/presentation/providers/audio_providers.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';
import 'package:mushafi/features/quran/presentation/widgets/ayah_action_sheet.dart';
import 'package:mushafi/features/quran/presentation/widgets/quran_page_view.dart';
import 'package:mushafi/features/quran/presentation/widgets/quran_toolbar.dart';
import 'package:mushafi/features/bookmarks/data/bookmark_repository.dart';

class MushafScreen extends ConsumerStatefulWidget {
  const MushafScreen({super.key, this.initialPage});

  final int? initialPage;

  @override
  ConsumerState<MushafScreen> createState() => _MushafScreenState();
}

class _MushafScreenState extends ConsumerState<MushafScreen> {
  late final PageController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    final int start = widget.initialPage ?? ref.read(currentPageProvider);
    _controller = PageController(initialPage: start - 1);
    WidgetsBinding.instance.addPostFrameCallback((_) => _boot());
  }

  Future<void> _boot() async {
    await ref.read(quranRepositoryProvider).initialize();
    if (widget.initialPage != null) {
      ref.read(currentPageProvider.notifier).state = widget.initialPage!;
    }
    setState(() => _ready = true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _persistPage(int page) async {
    ref.read(currentPageProvider.notifier).state = page;
    await ref.read(settingsRepositoryProvider).setLastPage(page);
  }

  void _toggleChrome() {
    ref.read(chromeVisibleProvider.notifier).state =
        !ref.read(chromeVisibleProvider);
  }

  Future<void> _openAyahSheet(Ayah ayah) async {
    final colors = MushafiColors.forMode(ref.read(themeModeProvider));
    await showAppBottomSheet<void>(
      context: context,
      child: AyahActionSheet(
        ayah: ayah,
        colors: colors,
        onPlay: () {
          Navigator.pop(context);
          ref.read(audioControllerProvider.notifier).playFromAyah(ayah);
        },
        onRepeatAyah: () {
          Navigator.pop(context);
          ref.read(audioControllerProvider.notifier).repeatAyah(ayah);
        },
        onBookmark: () async {
          await ref.read(bookmarkRepositoryProvider).addForAyah(ayah);
          if (mounted) Navigator.pop(context);
        },
        onNote: () {
          Navigator.pop(context);
          context.push('/notes/new', extra: ayah.key);
        },
        onShareText: () {},
        onCopy: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('تم النسخ')),
          );
        },
        onTafsir: () {
          Navigator.pop(context);
          context.push('/tafsir', extra: ayah.key);
        },
        onStartHifz: () {
          Navigator.pop(context);
          context.push('/tasmee3?surah=${ayah.surahId}&ayah=${ayah.ayahNumber}');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final colors = MushafiColors.forMode(themeMode);
    final chrome = ref.watch(chromeVisibleProvider);
    final engine = ref.watch(layoutEngineProvider);
    final scale = ref.watch(fontScaleProvider);
    final digits = ref.watch(digitStyleProvider);
    final highlight = ref.watch(highlightedAyahKeyProvider);
    final ready = ref.watch(quranReadyProvider);
    final repo = ref.watch(quranRepositoryProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: themeMode == MushafiThemeMode.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: colors.scaffold,
        body: ready.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('تعذّر التحميل: $e')),
          data: (report) {
            if (!_ready) {
              return const Center(child: CircularProgressIndicator());
            }
            final pages = repo.pageCount.clamp(1, 604);
            return Stack(
              children: [
                Column(
                  children: [
                    if (report.isMock)
                      Material(
                        color: colors.ornament.withValues(alpha: 0.12),
                        child: SafeArea(
                          bottom: false,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            child: Text(
                              'عيّنة تطويرية — ليست مصحفًا كاملاً. استبدل بيانات القرآن بمصدر مرخّص.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: colors.ornament,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      ),
                    Expanded(
                      child: PageView.builder(
                        controller: _controller,
                        reverse: true, // RTL: اسحب لليسار للصفحة التالية
                        itemCount: pages,
                        onPageChanged: (i) {
                          ref.read(chromeVisibleProvider.notifier).state = false;
                          _persistPage(i + 1);
                          // preload neighbors via providers
                          final next = i + 2;
                          final prev = i;
                          if (next <= pages) {
                            ref.read(quranPageProvider(next));
                          }
                          if (prev >= 1) {
                            ref.read(quranPageProvider(prev));
                          }
                        },
                        itemBuilder: (context, index) {
                          final pageNumber = index + 1;
                          final asyncPage =
                              ref.watch(quranPageProvider(pageNumber));
                          return asyncPage.when(
                            loading: () => Center(
                              child: CircularProgressIndicator(
                                color: colors.ornament,
                              ),
                            ),
                            error: (e, _) => Center(child: Text('$e')),
                            data: (page) => QuranPageView(
                              page: page,
                              colors: colors,
                              engine: engine,
                              fontScale: scale,
                              digitStyle: digits,
                              highlightedAyahKey: highlight,
                              onTap: _toggleChrome,
                              onAyahLongPress: _openAyahSheet,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: QuranToolbar(
                    colors: colors,
                    visible: chrome,
                    onSearch: () => context.push('/search'),
                    onSurahs: () => context.push('/surahs'),
                    onJuz: () => context.push('/juz'),
                    onBookmarks: () => context.push('/bookmarks'),
                    onListen: () =>
                        ref.read(audioControllerProvider.notifier).toggle(),
                    onSettings: () => context.push('/settings'),
                    onResume: () {
                      final p = ref.read(settingsRepositoryProvider).lastPage;
                      _controller.animateToPage(
                        p - 1,
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      );
                    },
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: AnimatedSlide(
                    offset: chrome ? Offset.zero : const Offset(0, 1),
                    duration: const Duration(milliseconds: 180),
                    child: const MiniPlayer(),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
