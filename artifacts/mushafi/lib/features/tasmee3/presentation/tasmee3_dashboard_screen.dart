import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import 'tasmee3_achievements_screen.dart';
import 'tasmee3_history_screen.dart';
import 'tasmee3_review_plan_screen.dart';
import 'tasmee3_screen.dart';
import 'widgets/tasmee3_week_stats_card.dart';

class Tasmee3DashboardScreen extends ConsumerWidget {
  const Tasmee3DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tasmee3SessionHistoryProvider);
    final stats = ref.watch(tasmee3Last7DaysStatsProvider);
    final reviewPlan = ref.watch(tasmee3ReviewPlanProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('لوحة التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _heroCard(context),
            const SizedBox(height: 14),
            stats.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) => _errorCard(error.toString()),
              data: (items) => Tasmee3WeekStatsCard(stats: items),
            ),
            const SizedBox(height: 14),
            history.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) => _errorCard(error.toString()),
              data: (sessions) {
                final total = sessions.length;
                final avg = sessions.isEmpty
                    ? 0
                    : (sessions
                                .map((e) => e.accuracyPercent)
                                .reduce((a, b) => a + b) /
                            sessions.length)
                        .round();

                return _summaryCard(
                  totalSessions: total,
                  averageAccuracy: avg,
                );
              },
            ),
            const SizedBox(height: 14),
            reviewPlan.when(
              loading: () => const SizedBox.shrink(),
              error: (error, stackTrace) => _errorCard(error.toString()),
              data: (items) => _reviewPlanPreview(context, items.length),
            ),
            const SizedBox(height: 16),
            _quickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _heroCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'مراجعة حفظك بذكاء وهدوء',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'ابدأ جلسة تسميع قصيرة، ثم راجع الأخطاء ومواضع الضعف.',
            style: TextStyle(
              color: Color(0xFF9A8068),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFA77A48),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const Tasmee3Screen()),
              );
            },
            icon: const Icon(Icons.mic),
            label: const Text('ابدأ تسميع جديد'),
          ),
        ],
      ),
    );
  }

  Widget _summaryCard({
    required int totalSessions,
    required int averageAccuracy,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _numberTile(
              title: 'الجلسات',
              value: '$totalSessions',
            ),
          ),
          Expanded(
            child: _numberTile(
              title: 'متوسط الدقة',
              value: '$averageAccuracy%',
            ),
          ),
        ],
      ),
    );
  }

  Widget _numberTile({
    required String title,
    required String value,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFFA77A48),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF9A8068),
          ),
        ),
      ],
    );
  }

  Widget _reviewPlanPreview(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.assignment_outlined,
            color: Color(0xFFA77A48),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              count == 0
                  ? 'لا توجد خطة مراجعة حاليا.'
                  : 'لديك $count موضعا مقترحا للمراجعة.',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF11100E),
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const Tasmee3ReviewPlanScreen(),
                ),
              );
            },
            child: const Text('عرض'),
          ),
        ],
      ),
    );
  }

  Widget _quickActions(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3HistoryScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.history),
                label: const Text('السجل'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3ReviewPlanScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.assignment_outlined),
                label: const Text('خطة المراجعة'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Tasmee3AchievementsScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.emoji_events_outlined),
                label: const Text('الإنجازات'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _errorCard(String message) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        message,
        style: const TextStyle(color: Colors.red),
      ),
    );
  }
}
