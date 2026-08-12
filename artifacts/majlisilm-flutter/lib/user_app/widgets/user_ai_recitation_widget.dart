import 'package:flutter/material.dart';

import '../../features/ai_recitation/ai_recitation.dart';
import '../../shared/theme/majlis_colors.dart';

/// Compatibility launcher for the advanced AI recitation module.
///
/// Prefer [AiRecitationView] directly for new call sites.
class UserAIRecitationWidget extends StatelessWidget {
  const UserAIRecitationWidget({
    super.key,
    required this.targetVerse,
    this.verseRef,
    this.label = 'اختبار التلاوة بالذكاء',
  });

  final String targetVerse;
  final String? verseRef;
  final String label;

  @override
  Widget build(BuildContext context) {
    if (targetVerse.trim().isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('حدّد آية للبدء في اختبار التلاوة.'),
      );
    }

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(label, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              targetVerse,
              textAlign: TextAlign.center,
              textDirection: TextDirection.rtl,
              style: const TextStyle(fontSize: 18, height: 1.9),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => AiRecitationView.open(
                context,
                targetVerse: targetVerse,
                verseRef: verseRef,
              ),
              icon: const Icon(Icons.mic_rounded),
              label: const Text('بدء التسميع المتقدم'),
              style: FilledButton.styleFrom(backgroundColor: MajlisColors.brown),
            ),
          ],
        ),
      ),
    );
  }
}
