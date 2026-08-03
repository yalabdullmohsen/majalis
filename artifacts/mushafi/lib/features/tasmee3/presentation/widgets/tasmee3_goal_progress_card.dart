import 'package:flutter/material.dart';

import '../../domain/tasmee3_goal_progress.dart';

class Tasmee3GoalProgressCard extends StatelessWidget {
  final Tasmee3GoalProgress progress;

  const Tasmee3GoalProgressCard({
    super.key,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    if (!progress.goal.enabled) {
      return const SizedBox.shrink();
    }

    final color =
        progress.completed ? Colors.green.shade700 : const Color(0xFFA77A48);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            progress.title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            progress.valueText,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.progress,
              minHeight: 10,
              color: color,
              backgroundColor: color.withValues(alpha: 0.12),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            progress.completed
                ? 'تم تحقيق هدف اليوم.'
                : 'استمر حتى تكمل هدف اليوم.',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
