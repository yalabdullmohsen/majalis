import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../data/surah_catalog.dart';

class Tasmee3HistoryScreen extends ConsumerWidget {
  const Tasmee3HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tasmee3SessionHistoryProvider);

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
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                error.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
          data: (sessions) {
            if (sessions.isEmpty) {
              return const Center(
                child: Text(
                  'لا توجد جلسات تسميع محفوظة حتى الآن.',
                  style: TextStyle(
                    color: Color(0xFF9A8068),
                    fontSize: 18,
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(tasmee3SessionHistoryProvider);
                await ref.read(tasmee3SessionHistoryProvider.future);
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: sessions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final session = sessions[index];
                  final surah = SurahCatalog.byId(session.target.from.surah);

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
                          backgroundColor:
                              const Color(0xFFA77A48).withValues(alpha: 0.12),
                          child: Text(
                            '${session.accuracyPercent}%',
                            style: const TextStyle(
                              color: Color(0xFFA77A48),
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
                                'الأخطاء: ${session.mistakesCount} | المدة: ${session.durationSeconds} ثانية',
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
}
