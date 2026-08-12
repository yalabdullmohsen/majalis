import 'package:flutter/material.dart';

import '../../domain/ayah_alignment_score.dart';

class Tasmee3AyahScoresCard extends StatelessWidget {
  final List<AyahAlignmentScore> scores;

  const Tasmee3AyahScoresCard({
    super.key,
    required this.scores,
  });

  @override
  Widget build(BuildContext context) {
    if (scores.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
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
            'نتيجة كل آية',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 10),
          ...scores.map((score) {
            final color = _color(score.accuracyPercent);

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(
                      'آية ${score.ayahRef.ayah}',
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
                        value: score.accuracy.clamp(0, 1),
                        minHeight: 8,
                        backgroundColor: color.withValues(alpha: 0.12),
                        color: color,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${score.accuracyPercent}%',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
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

  Color _color(int percent) {
    if (percent >= 90) return Colors.green.shade700;
    if (percent >= 75) return Colors.orange.shade800;
    return Colors.red.shade700;
  }
}
