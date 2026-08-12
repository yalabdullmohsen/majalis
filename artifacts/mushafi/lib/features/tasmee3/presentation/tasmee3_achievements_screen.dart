import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';

class Tasmee3AchievementsScreen extends ConsumerWidget {
  const Tasmee3AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final achievements = ref.watch(tasmee3AchievementsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('إنجازات التسميع'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: achievements.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                ref.read(tasmee3ErrorMapperProvider).map(error),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          data: (items) {
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = items[index];
                final color = item.unlocked
                    ? const Color(0xFFA77A48)
                    : const Color(0xFF9A8068);

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFCF7),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: item.unlocked
                          ? const Color(0xFFE0C5A3)
                          : const Color(0xFFE8E0D4),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        item.unlocked
                            ? Icons.emoji_events
                            : Icons.lock_outline,
                        color: color,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: item.unlocked
                                    ? const Color(0xFF11100E)
                                    : const Color(0xFF9A8068),
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.description,
                              style: const TextStyle(
                                color: Color(0xFF9A8068),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        item.unlocked ? 'مفتوح' : 'مغلق',
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
