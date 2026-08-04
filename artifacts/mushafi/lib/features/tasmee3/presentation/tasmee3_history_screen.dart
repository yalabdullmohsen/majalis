import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../data/surah_catalog.dart';
import '../domain/tasmee3_session_record.dart';
import 'widgets/tasmee3_empty_state.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3HistoryScreen extends ConsumerWidget {
  const Tasmee3HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tasmee3SessionHistoryProvider);
    final streak = ref.watch(tasmee3StreakProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('سجل التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: history.when(
          loading: () => const Tasmee3LoadingState(
            message: 'جاري تحميل سجل التسميع...',
          ),
          error: (error, stackTrace) => Tasmee3ErrorState(
            message: 'تعذر تحميل السجل. حاول مرة أخرى.',
            onRetry: () => ref.invalidate(tasmee3SessionHistoryProvider),
          ),
          data: (sessions) {
            if (sessions.isEmpty) {
              return const Tasmee3EmptyState(
                icon: Icons.history,
                title: 'لا توجد جلسات بعد',
                message: 'ابدأ أول جلسة تسميع حتى يظهر سجلك هنا.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(tasmee3SessionHistoryProvider);
                await ref.read(tasmee3SessionHistoryProvider.future);
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: sessions.length + 1,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _overallProgressCard(
                      sessions,
                      streak.maybeWhen(data: (v) => v, orElse: () => 0),
                    );
                  }

                  final session = sessions[index - 1];
                  final surah = SurahCatalog.byId(session.target.from.surah);
                  final color = accuracyColor(session.accuracyPercent);

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFCF7),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE0C5A3)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: color.withValues(alpha: 0.12),
                          child: Text(
                            '${session.accuracyPercent}%',
                            style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'سورة ${surah.nameArabic} من ${session.target.from.ayah} إلى ${session.target.to.ayah}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Color(0xFF11100E),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'مواضع للمراجعة: ${session.mistakesCount} | المدة: ${session.durationSeconds} ثانية',
                                style: const TextStyle(
                                  color: Color(0xFF9A8068),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _overallProgressCard(
    List<Tasmee3SessionRecord> sessions,
    int streak,
  ) {
    final avg = (sessions
                .map((e) => e.accuracyPercent)
                .reduce((a, b) => a + b) /
            sessions.length)
        .round();
    final recent = sessions.take(5).toList();
    final recentAvg = recent.isEmpty
        ? avg
        : (recent.map((e) => e.accuracyPercent).reduce((a, b) => a + b) /
                recent.length)
            .round();
    final trend = recentAvg >= avg
        ? 'الاتجاه العام مستقر أو صاعد.'
        : 'الاتجاه العام يحتاج مزيدا من المراجعة.';

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
            'التقدم العام',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'متوسط الدقة التقريبية: $avg% | آخر 5 جلسات: $recentAvg% | السلسلة: $streak يوم',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            trend,
            style: TextStyle(
              color: accuracyColor(recentAvg),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

Color accuracyColor(int percent) {
  if (percent >= 90) return Colors.green.shade700;
  if (percent >= 75) return Colors.orange.shade800;
  return Colors.red.shade700;
}
