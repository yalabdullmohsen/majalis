// DEPRECATED: Do not use in navigation. Replaced by lib/features/mushaf and lib/features/tasmee3.

import 'package:flutter/material.dart';
import 'package:mushafi/design_system/colors.dart';
import 'package:mushafi/design_system/widgets/app_icon_button.dart';

class QuranToolbar extends StatelessWidget {
  const QuranToolbar({
    super.key,
    required this.colors,
    required this.visible,
    this.onSearch,
    this.onSurahs,
    this.onJuz,
    this.onBookmarks,
    this.onListen,
    this.onSettings,
    this.onResume,
  });

  final MushafiColors colors;
  final bool visible;
  final VoidCallback? onSearch;
  final VoidCallback? onSurahs;
  final VoidCallback? onJuz;
  final VoidCallback? onBookmarks;
  final VoidCallback? onListen;
  final VoidCallback? onSettings;
  final VoidCallback? onResume;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedOpacity(
        opacity: visible ? 1 : 0,
        duration: const Duration(milliseconds: 180),
        child: Material(
          color: colors.paper.withValues(alpha: 0.94),
          elevation: 0,
          child: SafeArea(
            bottom: false,
            child: SizedBox(
              height: 52,
              child: Row(
                children: [
                  AppIconButton(
                    icon: Icons.arrow_forward,
                    colors: colors,
                    tooltip: 'رجوع',
                    onPressed: () => Navigator.maybePop(context),
                  ),
                  AppIconButton(
                    icon: Icons.search,
                    colors: colors,
                    tooltip: 'بحث',
                    onPressed: onSearch ?? () {},
                  ),
                  AppIconButton(
                    icon: Icons.list_alt,
                    colors: colors,
                    tooltip: 'السور',
                    onPressed: onSurahs ?? () {},
                  ),
                  AppIconButton(
                    icon: Icons.grid_view,
                    colors: colors,
                    tooltip: 'الأجزاء',
                    onPressed: onJuz ?? () {},
                  ),
                  const Spacer(),
                  AppIconButton(
                    icon: Icons.bookmark_border,
                    colors: colors,
                    tooltip: 'المفضلة',
                    onPressed: onBookmarks ?? () {},
                  ),
                  AppIconButton(
                    icon: Icons.headphones,
                    colors: colors,
                    tooltip: 'استماع',
                    onPressed: onListen ?? () {},
                  ),
                  AppIconButton(
                    icon: Icons.history,
                    colors: colors,
                    tooltip: 'آخر موضع',
                    onPressed: onResume ?? () {},
                  ),
                  AppIconButton(
                    icon: Icons.settings_outlined,
                    colors: colors,
                    tooltip: 'إعدادات',
                    onPressed: onSettings ?? () {},
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
