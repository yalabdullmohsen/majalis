import 'package:flutter/material.dart';

import '../domain/tasmee3_mistake.dart';

class Tasmee3MistakeTrainingScreen extends StatelessWidget {
  final List<Tasmee3Mistake> mistakes;

  const Tasmee3MistakeTrainingScreen({
    super.key,
    required this.mistakes,
  });

  @override
  Widget build(BuildContext context) {
    final realMistakes = mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence;
    }).toList();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('تدريب على الأخطاء'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
        ),
        body: realMistakes.isEmpty
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'لا توجد أخطاء تحتاج تدريبا في هذه الجلسة.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF9A8068),
                      fontSize: 18,
                    ),
                  ),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: realMistakes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final mistake = realMistakes[index];

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFCF7),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE0C5A3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'سورة ${mistake.ayahRef.surah} - آية ${mistake.ayahRef.ayah}',
                          style: const TextStyle(
                            color: Color(0xFF11100E),
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (mistake.expectedWord != null)
                          Text(
                            'راجع الكلمة: ${mistake.expectedWord}',
                            style: const TextStyle(
                              fontSize: 22,
                              color: Color(0xFFA77A48),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        if (mistake.recognizedWord != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            'المقروء: ${mistake.recognizedWord}',
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 16,
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        const Text(
                          'اقرأ الكلمة 3 مرات ثم أعد تسميع الآية كاملة.',
                          style: TextStyle(
                            color: Color(0xFF9A8068),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
