import 'package:flutter/material.dart';

/// Shared floating/snapping header for hide-on-scroll screens.
class UserHideOnScrollAppBar extends StatelessWidget {
  const UserHideOnScrollAppBar({
    super.key,
    required this.title,
    required this.backgroundColor,
    required this.foregroundColor,
    this.onSearch,
    this.onOpenSettings,
    this.bottom,
  });

  final String title;
  final Color backgroundColor;
  final Color foregroundColor;
  final VoidCallback? onSearch;
  final VoidCallback? onOpenSettings;
  final PreferredSizeWidget? bottom;

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      pinned: false,
      floating: true,
      snap: true,
      forceElevated: false,
      elevation: 0,
      scrolledUnderElevation: 1,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      surfaceTintColor: Colors.transparent,
      title: Text(title),
      actions: [
        if (onSearch != null)
          IconButton(
            tooltip: 'بحث',
            onPressed: onSearch,
            icon: const Icon(Icons.search),
          ),
        if (onOpenSettings != null)
          IconButton(
            tooltip: 'إعدادات القراءة',
            onPressed: onOpenSettings,
            icon: const Icon(Icons.tune_rounded),
          ),
      ],
      bottom: bottom,
    );
  }
}

/// Optional compact search field that rides under the app bar and hides with it.
class UserHideOnScrollSearchBar extends StatelessWidget
    implements PreferredSizeWidget {
  const UserHideOnScrollSearchBar({
    super.key,
    required this.hintText,
    required this.onTap,
    this.backgroundColor,
  });

  final String hintText;
  final VoidCallback onTap;
  final Color? backgroundColor;

  @override
  Size get preferredSize => const Size.fromHeight(52);

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? Colors.black.withOpacity(0.05);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.search, size: 18, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hintText,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
