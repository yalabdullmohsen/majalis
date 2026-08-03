import 'package:flutter/material.dart';

import '../../domain/tasmee3_review_suggestion.dart';

class Tasmee3TodayReviewCard extends StatelessWidget {
  final List<Tasmee3ReviewSuggestion> suggestions;
  final VoidCallback onOpen;

  const Tasmee3TodayReviewCard({
    super.key,
    required this.suggestions,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    final hasSuggestions = suggestions.isNotEmpty;

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
            Icons.auto_awesome,
            color: Color(0xFFA77A48),
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              hasSuggestions
                  ? 'لديك ${suggestions.length} مراجعة مستحقة اليوم.'
                  : 'لا توجد مراجعات مستحقة حاليا.',
              style: const TextStyle(
                color: Color(0xFF11100E),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          TextButton(
            onPressed: onOpen,
            child: const Text('عرض'),
          ),
        ],
      ),
    );
  }
}
