import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/tasmee3_providers.dart';
import '../domain/ayah_mastery_level.dart';
import '../domain/tasmee3_review_suggestion.dart';
import 'tasmee3_screen.dart';

class Tasmee3TodayReviewScreen extends ConsumerWidget {
  const Tasmee3TodayReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestions = ref.watch(tasmee3TodayReviewSuggestionsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('ماذا أراجع اليوم؟'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: suggestions.when(
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
          data: (items) {
            if (items.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'لا توجد مراجعات مستحقة اليوم. أكمل جلسة تسميع جديدة ليبدأ النظام ببناء خطة مراجعة.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF9A8068),
                      fontSize: 18,
                      height: 1.6,
                    ),
                  ),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = items[index];

                return _SuggestionCard(suggestion: item);
              },
            );
          },
        ),
      ),
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  final Tasmee3ReviewSuggestion suggestion;

  const _SuggestionCard({
    required this.suggestion,
  });

  @override
  Widget build(BuildContext context) {
    final color = _color(suggestion.dominantLevel);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            suggestion.title,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            suggestion.rangeLabel,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Color(0xFF11100E),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            suggestion.reason,
            style: const TextStyle(
              color: Color(0xFF9A8068),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'الوقت المتوقع: ${suggestion.estimatedMinutes} دقائق',
            style: const TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFA77A48),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const Tasmee3Screen(),
                ),
              );
            },
            icon: const Icon(Icons.mic),
            label: const Text('ابدأ التسميع'),
          ),
        ],
      ),
    );
  }

  Color _color(AyahMasteryLevel level) {
    switch (level) {
      case AyahMasteryLevel.newAyah:
        return Colors.blueGrey.shade700;
      case AyahMasteryLevel.weak:
        return Colors.red.shade700;
      case AyahMasteryLevel.learning:
        return Colors.orange.shade800;
      case AyahMasteryLevel.good:
        return Colors.green.shade700;
      case AyahMasteryLevel.mastered:
        return const Color(0xFFA77A48);
    }
  }
}
