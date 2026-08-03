import 'package:flutter/material.dart';

import '../../domain/tasmee3_mistake.dart';
import '../../domain/tasmee3_result.dart';

class Tasmee3MistakeReportSheet extends StatelessWidget {
  final Tasmee3Result result;

  const Tasmee3MistakeReportSheet({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final mistakes = result.mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord;
    }).toList();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'تقرير الأخطاء الظاهرة',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF11100E),
                ),
              ),
              const SizedBox(height: 12),
              if (mistakes.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'لا توجد أخطاء واضحة في هذه الجلسة.',
                    style: TextStyle(fontSize: 16),
                  ),
                )
              else
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: mistakes.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, index) {
                      final mistake = mistakes[index];

                      return ListTile(
                        leading: Icon(
                          _icon(mistake.type),
                          color: _color(mistake.type),
                        ),
                        title: Text(_title(mistake)),
                        subtitle: Text(
                          'سورة ${mistake.ayahRef.surah} - آية ${mistake.ayahRef.ayah}',
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _title(Tasmee3Mistake mistake) {
    switch (mistake.type) {
      case Tasmee3MistakeType.missingWord:
        return 'كلمة ناقصة: ${mistake.expectedWord ?? ''}';
      case Tasmee3MistakeType.extraWord:
        return 'كلمة زائدة: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.wrongWord:
        return 'الصحيح: ${mistake.expectedWord ?? ''} | المقروء: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.lowConfidence:
        return 'جودة صوت منخفضة';
    }
  }

  IconData _icon(Tasmee3MistakeType type) {
    switch (type) {
      case Tasmee3MistakeType.missingWord:
        return Icons.remove_circle_outline;
      case Tasmee3MistakeType.extraWord:
        return Icons.add_circle_outline;
      case Tasmee3MistakeType.wrongWord:
        return Icons.error_outline;
      case Tasmee3MistakeType.lowConfidence:
        return Icons.hearing_disabled_outlined;
    }
  }

  Color _color(Tasmee3MistakeType type) {
    switch (type) {
      case Tasmee3MistakeType.missingWord:
        return Colors.orange.shade800;
      case Tasmee3MistakeType.extraWord:
        return Colors.blue.shade700;
      case Tasmee3MistakeType.wrongWord:
        return Colors.red.shade700;
      case Tasmee3MistakeType.lowConfidence:
        return Colors.grey.shade700;
    }
  }
}
