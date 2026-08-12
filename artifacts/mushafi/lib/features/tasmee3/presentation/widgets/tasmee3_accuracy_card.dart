import 'package:flutter/material.dart';

import '../../domain/tasmee3_result.dart';

class Tasmee3AccuracyCard extends StatelessWidget {
  final Tasmee3Result result;

  const Tasmee3AccuracyCard({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final percent = result.accuracyPercent;

    Color color;
    String label;

    if (percent >= 90) {
      color = Colors.green.shade700;
      label = 'قراءة متقاربة';
    } else if (percent >= 75) {
      color = Colors.orange.shade800;
      label = 'جيدة تقريباً';
    } else {
      color = Colors.red.shade700;
      label = 'تحتاج مراجعة';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: color.withValues(alpha: 0.12),
            child: Text(
              '$percent%',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'مواضع تحتاج مراجعة: ${result.mistakesCount}',
                  style: const TextStyle(
                    color: Color(0xFF9A8068),
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'دقة تقريبية: $percent%',
                  style: const TextStyle(
                    color: Color(0xFF9A8068),
                    fontSize: 13,
                  ),
                ),
                if (result.hasLowConfidence) ...[
                  const SizedBox(height: 4),
                  const Text(
                    'جودة التعرف منخفضة. حاول في مكان أهدأ.',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
