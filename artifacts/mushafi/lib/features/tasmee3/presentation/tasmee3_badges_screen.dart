import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/tasmee3_badge.dart';
import 'widgets/tasmee3_empty_state.dart';
import 'widgets/tasmee3_error_state.dart';
import 'widgets/tasmee3_loading_state.dart';

class Tasmee3BadgesScreen extends ConsumerWidget {
  const Tasmee3BadgesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badges = ref.watch(tasmee3BadgesProvider);

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
        body: badges.when(
          loading: () => const Tasmee3LoadingState(
            message: 'جاري تحميل الإنجازات...',
          ),
          error: (error, stackTrace) => Tasmee3ErrorState(
            message: 'تعذر تحميل الإنجازات.',
            onRetry: () => ref.invalidate(tasmee3BadgesProvider),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Tasmee3EmptyState(
                icon: Icons.emoji_events_outlined,
                title: 'لا إنجازات بعد',
                message: 'أكمل جلسات تسميع منتظمة لتظهر إنجازاتك هنا.',
              );
            }

            return GridView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.92,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemBuilder: (context, index) {
                final badge = items[index];

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFCF7),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: badge.unlocked
                          ? const Color(0xFFA77A48)
                          : const Color(0xFFE0C5A3),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _icon(badge.type),
                        size: 42,
                        color: badge.unlocked
                            ? const Color(0xFFA77A48)
                            : const Color(0xFF9A8068),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        badge.title,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: badge.unlocked
                              ? const Color(0xFF11100E)
                              : const Color(0xFF9A8068),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        badge.description,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF9A8068),
                          fontSize: 13,
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

  IconData _icon(Tasmee3BadgeType type) {
    switch (type) {
      case Tasmee3BadgeType.firstSession:
        return Icons.flag_outlined;
      case Tasmee3BadgeType.threeDayStreak:
        return Icons.local_fire_department_outlined;
      case Tasmee3BadgeType.sevenDayStreak:
        return Icons.whatshot_outlined;
      case Tasmee3BadgeType.tenSessions:
        return Icons.layers_outlined;
      case Tasmee3BadgeType.highAccuracy:
        return Icons.verified_outlined;
      case Tasmee3BadgeType.reviewHero:
        return Icons.workspace_premium_outlined;
    }
  }
}
