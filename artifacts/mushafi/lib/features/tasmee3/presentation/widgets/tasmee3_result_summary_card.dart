import 'package:flutter/material.dart';

class Tasmee3ResultSummaryCard extends StatelessWidget {
  final double accuracy;
  final int mistakesCount;
  final int durationSeconds;

  const Tasmee3ResultSummaryCard({
    super.key,
    required this.accuracy,
    required this.mistakesCount,
    required this.durationSeconds,
  });

  @override
  Widget build(BuildContext context) {
    final percent = (accuracy * 100).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE0C5A3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'ملخص الجلسة',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF11100E),
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _Metric(
                  label: 'دقة تقريبية',
                  value: '$percent%',
                ),
              ),
              Expanded(
                child: _Metric(
                  label: 'مواضع مراجعة',
                  value: '$mistakesCount',
                ),
              ),
              Expanded(
                child: _Metric(
                  label: 'المدة',
                  value: '$durationSecondsث',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'النتيجة أداة مساعدة للمراجعة وليست حكما شرعيا على التلاوة.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A8068),
              fontSize: 12.5,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;

  const _Metric({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFFA77A48),
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFF9A8068),
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
