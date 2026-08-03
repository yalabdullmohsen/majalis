import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/tasmee3/presentation/widgets/tasmee3_result_summary_card.dart';

void main() {
  testWidgets('Tasmee3ResultSummaryCard renders', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Tasmee3ResultSummaryCard(
            accuracy: 0.9,
            mistakesCount: 2,
            durationSeconds: 30,
          ),
        ),
      ),
    );

    expect(find.text('ملخص الجلسة'), findsOneWidget);
    expect(find.text('90%'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
  });
}
