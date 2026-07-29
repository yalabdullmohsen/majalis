import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../controllers/user_quran_app_controller.dart';
import '../data/user_quran_repository.dart';
import '../widgets/user_hide_on_scroll_app_bar.dart';
import '../widgets/user_quran_page_view.dart';
import '../widgets/user_verse_bottom_sheet.dart';

/// Immersive Quran reader — edge-to-edge page + hide-on-scroll chrome.
///
/// Uses [NestedScrollView] with a floating/snapping [SliverAppBar] so the
/// header, search field, and options slide away on scroll-down and return
/// on scroll-up. The page canvas itself is 100% viewport width (native only).
class UserQuranReaderView extends StatelessWidget {
  const UserQuranReaderView({
    super.key,
    this.surah = 1,
    this.title = 'المصحف الشريف',
    this.onSearch,
    this.onOpenSettings,
  });

  final int surah;
  final String title;
  final VoidCallback? onSearch;
  final VoidCallback? onOpenSettings;

  @override
  Widget build(BuildContext context) {
    final quran = context.watch<UserQuranAppController>();
    final verses = UserQuranRepository.getVerses(surah: surah);
    final screenWidth = MediaQuery.sizeOf(context).width;

    return ColoredBox(
      color: quran.backgroundColor,
      child: NestedScrollView(
        floatHeaderSlivers: true,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            UserHideOnScrollAppBar(
              title: title,
              backgroundColor: quran.backgroundColor,
              foregroundColor: quran.textColor,
              onSearch: onSearch,
              onOpenSettings: onOpenSettings,
              forceElevated: innerBoxIsScrolled,
              bottom: onSearch == null
                  ? null
                  : UserHideOnScrollSearchBar(
                      hintText: 'بحث برقم الآية أو النص…',
                      onTap: onSearch!,
                      backgroundColor: quran.isDarkMode
                          ? Colors.white10
                          : Colors.black.withOpacity(0.05),
                    ),
            ),
          ];
        },
        body: Builder(
          builder: (context) {
            return CustomScrollView(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              slivers: [
                SliverToBoxAdapter(
                  child: SizedBox(
                    width: screenWidth,
                    child: UserQuranPageView(
                      verses: verses,
                      fontSize: quran.fontSize,
                      textColor: quran.textColor,
                      backgroundColor: quran.backgroundColor,
                      isDark: quran.isDarkMode,
                      selectedIndex: quran.selectedVerseIndex,
                      playingIndex: quran.isPlayingAudio
                          ? quran.currentPlayingVerse
                          : null,
                      safetyPadding: 3,
                      onVerseTap: (index) {
                        quran.selectVerse(index);
                        final verse = verses[index];
                        UserVerseBottomSheet.show(
                          context,
                          verse: verse,
                          index: index,
                        );
                      },
                    ),
                  ),
                ),
                // Extra scroll room so hide-on-scroll works even on short surahs.
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            );
          },
        ),
      ),
    );
  }
}
