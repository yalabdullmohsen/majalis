import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/ai_recitation/ai_recitation.dart';
import '../../shared/theme/majlis_colors.dart';
import '../controllers/user_educational_progress_controller.dart';
import '../controllers/user_quran_app_controller.dart';
import '../data/user_quran_repository.dart';
import '../widgets/user_hide_on_scroll_app_bar.dart';

/// Educational courses + Adhkar + AI recitation with hide-on-scroll header.
class UserEducationalPathsView extends StatelessWidget {
  const UserEducationalPathsView({
    super.key,
    this.title = 'المسارات والأذكار',
    this.onSearch,
    this.onOpenSettings,
  });

  final String title;
  final VoidCallback? onSearch;
  final VoidCallback? onOpenSettings;

  @override
  Widget build(BuildContext context) {
    final edu = context.watch<UserEducationalProgressController>();
    final quran = context.watch<UserQuranAppController>();
    final verse = UserQuranRepository.getByIndex(
          quran.selectedVerseIndex ?? 0,
        ) ??
        UserQuranRepository.getByIndex(0);
    final target = verse?.textUthmani ?? '';

    return ColoredBox(
      color: quran.backgroundColor,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          UserHideOnScrollAppBar(
            title: title,
            backgroundColor: quran.backgroundColor,
            foregroundColor: quran.textColor,
            onSearch: onSearch,
            onOpenSettings: onOpenSettings,
            bottom: onSearch == null
                ? null
                : UserHideOnScrollSearchBar(
                    hintText: 'بحث في المسارات والأذكار…',
                    onTap: onSearch!,
                    backgroundColor: quran.isDarkMode
                        ? Colors.white10
                        : Colors.black.withValues(alpha: 0.05),
                  ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  'المسارات العلمية النشطة',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                ...edu.courses.map((course) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.brown.withValues(alpha: 0.12)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            course.titleAr,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 10),
                          LinearProgressIndicator(
                            value: course.progress,
                            minHeight: 8,
                            borderRadius: BorderRadius.circular(8),
                            color: MajlisColors.sage,
                            backgroundColor: Colors.black12,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '%${(course.progress * 100).round()} مكتمل',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                Text(
                  'متابعة الأذكار اليومية',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                ...edu.dailyAdhkar.map((item) {
                  return CheckboxListTile(
                    value: item.done,
                    onChanged: (_) => edu.toggleAdhkar(item.id),
                    title: Text(item.titleAr),
                    activeColor: MajlisColors.brown,
                    controlAffinity: ListTileControlAffinity.leading,
                  );
                }),
                const SizedBox(height: 12),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.brown.withValues(alpha: 0.12)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'التسميع الذكي',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          target.isEmpty
                              ? 'اختر آية من المصحف ثم ابدأ التسميع.'
                              : target,
                          textAlign: TextAlign.center,
                          textDirection: TextDirection.rtl,
                          style: const TextStyle(fontSize: 18, height: 1.9),
                        ),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          onPressed: target.isEmpty
                              ? null
                              : () => AiRecitationView.open(
                                    context,
                                    targetVerse: target,
                                    verseRef: verse?.verseRef,
                                  ),
                          icon: const Icon(Icons.mic_rounded),
                          label: const Text('فتح جلسة التسميع المتقدمة'),
                          style: FilledButton.styleFrom(
                            backgroundColor: MajlisColors.brown,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
