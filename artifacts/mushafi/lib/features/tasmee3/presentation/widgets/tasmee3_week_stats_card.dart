import 'package:flutter/material.dart';

import '../../domain/tasmee3_daily_stats.dart';

class Tasmee3WeekStatsCard extends StatelessWidget {
  final List<Tasmee3DailyStats> stats;

  const Tasmee3WeekStatsCard({
    super.key,
    required this.stats,
  });

  @override
  Widget build(BuildContext context) {
    final maxSessions = stats.isEmpty
        ? 1
        : stats
            .map((item) => item.sessionsCount)
            .fold<int>(1, (a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'آخر 7 أيام',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: stats.map((item) {
              final height = item.sessionsCount == 0
                  ? 8.0
                  : 20 + (item.sessionsCount / maxSessions) * 70;

              return Expanded(
                child: Column(
                  children: [
                    Container(
                      height: height,
                      width: 18,
                      decoration: BoxDecoration(
                        color: item.sessionsCount == 0
                            ? const Color(0xFFE0C5A3)
                            : const Color(0xFFA77A48),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${item.day.day}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF9A8068),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Text(
            _summaryText(),
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  String _summaryText() {
    final totalSessions = stats.fold<int>(
      0,
      (sum, item) => sum + item.sessionsCount,
    );

    final totalMinutes = stats.fold<int>(
      0,
      (sum, item) => sum + item.totalDurationMinutes,
    );

    return 'مجموع الجلسات: $totalSessions | مجموع الوقت: $totalMinutes دقيقة';
  }
}
