import 'package:flutter/material.dart';

import '../../domain/tasmee3_live_progress.dart';

class Tasmee3LiveProgressCard extends StatelessWidget {
  final Tasmee3LiveProgress progress;

  const Tasmee3LiveProgressCard({
    super.key,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    if (!progress.hasWords) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            progress.currentAyah == null
                ? 'متابعة مباشرة'
                : 'الآية الحالية: ${progress.currentAyah!.ayah}',
            style: const TextStyle(
              color: Color(0xFF11100E),
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.progress,
              minHeight: 9,
              backgroundColor:
                  const Color(0xFFE0C5A3).withValues(alpha: 0.28),
              color: const Color(0xFFA77A48),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'تمت متابعة ${progress.recognizedCount} من ${progress.totalWords} كلمة',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          if (progress.isUserPossiblySilent) ...[
            const SizedBox(height: 6),
            const Text(
              'يبدو أنك توقفت قليلا. أكمل من الموضع الحالي.',
              style: TextStyle(
                color: Colors.orange,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
