import 'package:flutter/material.dart';

import '../../domain/live_audio_level.dart';

class Tasmee3AudioLevelMeter extends StatelessWidget {
  final LiveAudioLevel? level;

  const Tasmee3AudioLevelMeter({
    super.key,
    required this.level,
  });

  @override
  Widget build(BuildContext context) {
    final current = level?.current ?? 0.0;

    Color color;
    String label;

    if (current < 0.08) {
      color = Colors.red.shade700;
      label = 'الصوت منخفض';
    } else if (current < 0.18) {
      color = Colors.orange.shade800;
      label = 'الصوت متوسط';
    } else {
      color = Colors.green.shade700;
      label = 'الصوت جيد';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: current.clamp(0, 1),
              minHeight: 9,
              backgroundColor: color.withValues(alpha: 0.12),
              color: color,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'حاول إبقاء المؤشر في المستوى الأخضر أثناء القراءة.',
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
