import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/core/theme/app_theme.dart';
import 'package:mushafi/features/mushaf/application/mushaf_providers.dart';
import 'package:mushafi/features/mushaf/presentation/mushaf_design_tokens.dart';
import 'package:mushafi/features/quran/presentation/providers/quran_providers.dart';

/// شاشة الدخول: المصحف الجديد والتسميع الجديد فقط (بلا واجهات قديمة).
class HomeShell extends ConsumerWidget {
  const HomeShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final night = ref.watch(themeModeProvider) == MushafiThemeMode.dark;
    final bg = night ? MushafColors.nightBackground : MushafColors.background;
    final surface = night ? MushafColors.nightSurface : MushafColors.surface;
    final text = night ? MushafColors.nightText : MushafColors.text;
    final muted = MushafColors.mutedText;
    final mushafPage = ref.watch(mushafControllerProvider).currentPage;

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(MushafSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: MushafSpacing.xl),
              Text(
                AppConstants.appName,
                textAlign: TextAlign.center,
                style: MushafTextStyles.title.copyWith(
                  fontSize: 34,
                  color: MushafColors.primary,
                ),
              ),
              const SizedBox(height: MushafSpacing.sm),
              Text(
                'مصحف هادئ للقراءة والتلاوة ومراجعة الحفظ',
                textAlign: TextAlign.center,
                style: MushafTextStyles.secondary.copyWith(color: muted),
              ),
              const Spacer(),
              _HomeActionCard(
                surface: surface,
                icon: Icons.menu_book_outlined,
                title: 'المصحف الجديد',
                subtitle: 'قراءة · بحث · ختمة · مفضلة',
                badge: 'المصحف الجديد',
                filled: true,
                onTap: () => context.go('/mushaf-home'),
              ),
              const SizedBox(height: MushafSpacing.md),
              _HomeActionCard(
                surface: surface,
                icon: Icons.play_arrow_rounded,
                title: 'متابعة القراءة',
                subtitle: 'الصفحة $mushafPage',
                onTap: () => context.go('/mushaf?page=$mushafPage'),
              ),
              const SizedBox(height: MushafSpacing.md),
              _HomeActionCard(
                surface: surface,
                icon: Icons.mic_none_outlined,
                title: 'التسميع الجديد',
                subtitle: 'أداة مساعدة — دقة تقريبية',
                badge: 'التسميع الجديد',
                filled: true,
                filledColor: MushafColors.primaryDark,
                onTap: () => context.go('/tasmee3'),
              ),
              const SizedBox(height: MushafSpacing.md),
              _HomeActionCard(
                surface: surface,
                icon: Icons.settings_outlined,
                title: 'الإعدادات',
                subtitle: 'المظهر والحساب المحلي',
                onTap: () => context.go('/settings'),
              ),
              const Spacer(),
              Text(
                'تجربة أصلية لمصحفي — دون نسخ واجهات تطبيقات أخرى.',
                textAlign: TextAlign.center,
                style: TextStyle(color: muted, fontSize: 12, height: 1.4),
              ),
              const SizedBox(height: MushafSpacing.sm),
              Text(
                'اقرأ بهدوء، وراجع حفظك بالتسميع عند الحاجة.',
                textAlign: TextAlign.center,
                style: TextStyle(color: text.withValues(alpha: 0.55), fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  const _HomeActionCard({
    required this.surface,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge,
    this.filled = false,
    this.filledColor,
  });

  final Color surface;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? badge;
  final bool filled;
  final Color? filledColor;

  @override
  Widget build(BuildContext context) {
    final bg = filled ? (filledColor ?? MushafColors.primary) : surface;
    final fg = filled ? Colors.white : MushafColors.text;
    final subFg = filled ? Colors.white.withValues(alpha: 0.85) : MushafColors.mutedText;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(MushafRadius.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(MushafRadius.lg),
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.symmetric(
            horizontal: MushafSpacing.lg,
            vertical: MushafSpacing.md,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(MushafRadius.lg),
            border: filled ? null : Border.all(color: MushafColors.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: filled ? Colors.white : MushafColors.primary),
              const SizedBox(width: MushafSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: TextStyle(
                              color: fg,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        if (badge != null) ...[
                          const SizedBox(width: 8),
                          Semantics(
                            label: badge,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: filled
                                    ? Colors.white.withValues(alpha: 0.18)
                                    : MushafColors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(MushafRadius.pill),
                              ),
                              child: Text(
                                'جديد',
                                style: TextStyle(
                                  color: filled ? Colors.white : MushafColors.primaryDark,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(subtitle, style: TextStyle(color: subFg, fontSize: 12.5)),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_left,
                color: filled ? Colors.white70 : MushafColors.mutedText,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
