import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../shared/theme/majlis_colors.dart';
import '../controllers/user_educational_progress_controller.dart';
import '../controllers/user_quran_app_controller.dart';
import '../data/user_quran_repository.dart';
import '../widgets/user_ai_recitation_widget.dart';

/// Educational courses (LinearProgress) + Adhkar CheckboxListTile + AI recitation.
class UserEducationalPathsView extends StatelessWidget {
  const UserEducationalPathsView({super.key});

  @override
  Widget build(BuildContext context) {
    final edu = context.watch<UserEducationalProgressController>();
    final quran = context.watch<UserQuranAppController>();
    final target = UserQuranRepository.getByIndex(
          quran.selectedVerseIndex ?? 0,
        )?.textUthmani ??
        UserQuranRepository.getByIndex(0)?.textUthmani ??
        '';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
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
              side: BorderSide(color: Colors.brown.withOpacity(0.12)),
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
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
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
        const SizedBox(height: 8),
        UserAIRecitationWidget(targetVerse: target),
      ],
    );
  }
}
