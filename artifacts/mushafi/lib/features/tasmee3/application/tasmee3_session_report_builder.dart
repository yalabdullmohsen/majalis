import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';

class Tasmee3SessionReportBuilder {
  const Tasmee3SessionReportBuilder();

  String buildTextReport({
    required RecitationTarget target,
    required Tasmee3Result result,
    required int durationSeconds,
  }) {
    final buffer = StringBuffer();

    buffer.writeln('تقرير جلسة التسميع');
    buffer.writeln('====================');
    buffer.writeln('السورة: ${target.from.surah}');
    buffer.writeln('من آية: ${target.from.ayah}');
    buffer.writeln('إلى آية: ${target.to.ayah}');
    buffer.writeln('المدة: $durationSeconds ثانية');
    buffer.writeln('الدقة التقريبية: ${result.accuracyPercent}%');
    buffer.writeln('عدد الأخطاء: ${result.mistakesCount}');
    buffer.writeln('');

    final mistakes = result.mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence;
    }).toList();

    if (mistakes.isEmpty) {
      buffer.writeln('لا توجد أخطاء ظاهرة.');
    } else {
      buffer.writeln('تفاصيل الأخطاء:');

      for (final mistake in mistakes) {
        buffer.writeln(
          '- سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}: ${_mistakeText(mistake)}',
        );
      }
    }

    buffer.writeln('');
    buffer.writeln(
      'ملاحظة: هذا التقرير تقريبي ومبني على التعرف الصوتي والمطابقة التقنية.',
    );

    return buffer.toString();
  }

  String _mistakeText(Tasmee3Mistake mistake) {
    switch (mistake.type) {
      case Tasmee3MistakeType.missingWord:
        return 'كلمة ناقصة: ${mistake.expectedWord ?? ''}';
      case Tasmee3MistakeType.extraWord:
        return 'كلمة زائدة: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.wrongWord:
        return 'الصحيح: ${mistake.expectedWord ?? ''}، المقروء: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.lowConfidence:
        return 'كلمة بثقة منخفضة: ${mistake.expectedWord ?? ''}';
    }
  }
}
