import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../tasmee3/presentation/widgets/tasmee3_app_scaffold.dart';
import '../application/mushaf_providers.dart';
import 'mushaf_bookmarks_screen.dart';
import 'mushaf_design_tokens.dart';
import 'mushaf_downloads_screen.dart';
import 'mushaf_favorites_screen.dart';
import 'mushaf_khatmah_screen.dart';
import 'mushaf_notes_screen.dart';
import 'mushaf_review_markers_screen.dart';
import 'mushaf_screen.dart';
import 'mushaf_search_screen.dart';

class MushafHomeScreen extends ConsumerWidget {
  const MushafHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mushafState = ref.watch(mushafControllerProvider);
    final khatmahState = ref.watch(khatmahPlanControllerProvider);
    final activeKhatmah = khatmahState.activePlan;

    return Tasmee3AppScaffold(
      title: 'المصحف',
      titleBadge: 'المصحف الجديد',
      body: ListView(
        padding: const EdgeInsets.all(MushafSpacing.lg),
        children: [
          _HeroReadingCard(
            currentPage: mushafState.currentPage,
            onContinue: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MushafScreen(
                    initialPage: mushafState.currentPage,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: MushafSpacing.lg),
          if (activeKhatmah != null) ...[
            _KhatmahSummaryCard(
              progressPercent: activeKhatmah.progressPercent,
              dailyPages: activeKhatmah.dailyPagesTarget,
              isLate: activeKhatmah.isLate,
              lateByPages: activeKhatmah.lateByPages,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const MushafKhatmahScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: MushafSpacing.lg),
          ],
          _QuickGrid(
            items: [
              _QuickItem(
                icon: Icons.menu_book_outlined,
                label: 'فتح المصحف',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.search,
                label: 'البحث',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafSearchScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.bookmark_border,
                label: 'العلامات',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafBookmarksScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.star_border,
                label: 'المفضلة',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafFavoritesScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.note_alt_outlined,
                label: 'الملاحظات',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafNotesScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.report_problem_outlined,
                label: 'مراجعة',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafReviewMarkersScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.download_outlined,
                label: 'الصوت',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafDownloadsScreen(),
                    ),
                  );
                },
              ),
              _QuickItem(
                icon: Icons.route_outlined,
                label: 'الختمة',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MushafKhatmahScreen(),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: MushafSpacing.lg),
          const _PrivacyNote(),
        ],
      ),
    );
  }
}

class _HeroReadingCard extends StatelessWidget {
  final int currentPage;
  final VoidCallback onContinue;

  const _HeroReadingCard({
    required this.currentPage,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(MushafSpacing.xl),
      decoration: BoxDecoration(
        color: MushafColors.paper,
        borderRadius: BorderRadius.circular(MushafRadius.xl),
        border: Border.all(color: MushafColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(
            Icons.menu_book_outlined,
            color: MushafColors.primary,
            size: 52,
          ),
          const SizedBox(height: MushafSpacing.md),
          const Text(
            'تابع قراءة القرآن',
            textAlign: TextAlign.center,
            style: MushafTextStyles.title,
          ),
          const SizedBox(height: MushafSpacing.sm),
          Text(
            'آخر صفحة: $currentPage',
            textAlign: TextAlign.center,
            style: MushafTextStyles.secondary,
          ),
          const SizedBox(height: MushafSpacing.xs),
          const Text(
            'تقسيم 604 صفحة كالموقع — متابعة وبحث وختمة ومراجعة.',
            textAlign: TextAlign.center,
            style: MushafTextStyles.secondary,
          ),
          const SizedBox(height: MushafSpacing.lg),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: MushafColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(MushafRadius.md),
              ),
            ),
            onPressed: onContinue,
            icon: const Icon(Icons.arrow_back),
            label: const Text('فتح المصحف'),
          ),
        ],
      ),
    );
  }
}

class _KhatmahSummaryCard extends StatelessWidget {
  final int progressPercent;
  final int dailyPages;
  final bool isLate;
  final int lateByPages;
  final VoidCallback onTap;

  const _KhatmahSummaryCard({
    required this.progressPercent,
    required this.dailyPages,
    required this.isLate,
    required this.lateByPages,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(MushafRadius.lg),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(MushafSpacing.lg),
        decoration: BoxDecoration(
          color: MushafColors.surface,
          borderRadius: BorderRadius.circular(MushafRadius.lg),
          border: Border.all(color: MushafColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('خطة الختمة', style: MushafTextStyles.sectionTitle),
            const SizedBox(height: MushafSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(MushafRadius.pill),
              child: LinearProgressIndicator(
                value: progressPercent / 100,
                minHeight: 9,
                color: MushafColors.primary,
                backgroundColor: MushafColors.border.withValues(alpha: 0.35),
              ),
            ),
            const SizedBox(height: MushafSpacing.sm),
            Text(
              'الإنجاز: $progressPercent% - وردك اليومي $dailyPages صفحة',
              style: MushafTextStyles.secondary,
            ),
            if (isLate)
              Text(
                'متأخر $lateByPages صفحة عن الخطة.',
                style: MushafTextStyles.secondary.copyWith(
                  color: MushafColors.warning,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _QuickGrid extends StatelessWidget {
  final List<_QuickItem> items;

  const _QuickGrid({
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      itemCount: items.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: MushafSpacing.md,
        mainAxisSpacing: MushafSpacing.md,
        childAspectRatio: 2.1,
      ),
      itemBuilder: (context, index) {
        final item = items[index];

        return InkWell(
          borderRadius: BorderRadius.circular(MushafRadius.lg),
          onTap: item.onTap,
          child: Container(
            padding: const EdgeInsets.all(MushafSpacing.md),
            decoration: BoxDecoration(
              color: MushafColors.surface,
              borderRadius: BorderRadius.circular(MushafRadius.lg),
              border: Border.all(color: MushafColors.border),
            ),
            child: Row(
              children: [
                Icon(item.icon, color: MushafColors.primary),
                const SizedBox(width: MushafSpacing.sm),
                Expanded(
                  child: Text(
                    item.label,
                    style: MushafTextStyles.body.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _QuickItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });
}

class _PrivacyNote extends StatelessWidget {
  const _PrivacyNote();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'النص من ملف موثّق داخل التطبيق (لا يُولَّد بالذكاء الاصطناعي). '
      'حدود الصفحات موحّدة مع مصحف majlisilm.com (مدينة / 604).',
      textAlign: TextAlign.center,
      style: MushafTextStyles.secondary,
    );
  }
}
