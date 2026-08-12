import 'package:flutter/material.dart';

import '../../domain/tasmee3_live_ayah_progress.dart';

class Tasmee3LiveAyahProgressCard extends StatelessWidget {
  final List<Tasmee3LiveAyahProgress> ayahProgress;

  const Tasmee3LiveAyahProgressCard({
    super.key,
    required this.ayahProgress,
  });

  @override
  Widget build(BuildContext context) {
    if (ayahProgress.isEmpty) {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'تقدم الآيات',
            style: TextStyle(
              color: Color(0xFF11100E),
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 10),
          ...ayahProgress.map((item) {
            final color = item.possibleMistakes > 0
                ? Colors.orange.shade800
                : item.completed
                    ? Colors.green.shade700
                    : const Color(0xFFA77A48);

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 64,
                    child: Text(
                      'آية ${item.ayahRef.ayah}',
                      style: const TextStyle(
                        color: Color(0xFF11100E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: item.progress,
                        minHeight: 8,
                        color: color,
                        backgroundColor: color.withValues(alpha: 0.12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${item.progressPercent}%',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
