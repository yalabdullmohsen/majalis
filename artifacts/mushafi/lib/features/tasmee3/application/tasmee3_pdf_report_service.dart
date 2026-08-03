import 'dart:io';

import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';

class Tasmee3PdfReportService {
  const Tasmee3PdfReportService();

  Future<File> buildSessionPdf({
    required RecitationTarget target,
    required Tasmee3Result result,
    required int durationSeconds,
  }) async {
    final pdf = pw.Document();

    final fontData = await rootBundle.load(
      'assets/fonts/ScheherazadeNew-Regular.ttf',
    );
    final arabicFont = pw.Font.ttf(fontData);

    final mistakes = result.mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence;
    }).toList();

    final baseStyle = pw.TextStyle(font: arabicFont, fontSize: 14);
    final titleStyle = pw.TextStyle(
      font: arabicFont,
      fontSize: 24,
      fontWeight: pw.FontWeight.bold,
    );
    final headingStyle = pw.TextStyle(
      font: arabicFont,
      fontSize: 18,
      fontWeight: pw.FontWeight.bold,
    );
    final boldStyle = pw.TextStyle(
      font: arabicFont,
      fontWeight: pw.FontWeight.bold,
    );
    final noteStyle = pw.TextStyle(font: arabicFont, fontSize: 10);

    pdf.addPage(
      pw.MultiPage(
        textDirection: pw.TextDirection.rtl,
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        theme: pw.ThemeData.withFont(base: arabicFont, bold: arabicFont),
        build: (context) {
          return [
            pw.Text(
              'تقرير جلسة التسميع',
              style: titleStyle,
              textDirection: pw.TextDirection.rtl,
            ),
            pw.SizedBox(height: 16),
            _infoLine('السورة', '${target.from.surah}', baseStyle, boldStyle),
            _infoLine('من آية', '${target.from.ayah}', baseStyle, boldStyle),
            _infoLine('إلى آية', '${target.to.ayah}', baseStyle, boldStyle),
            _infoLine(
              'المدة',
              '$durationSeconds ثانية',
              baseStyle,
              boldStyle,
            ),
            _infoLine(
              'الدقة التقريبية',
              '${result.accuracyPercent}%',
              baseStyle,
              boldStyle,
            ),
            _infoLine(
              'عدد الأخطاء',
              '${result.mistakesCount}',
              baseStyle,
              boldStyle,
            ),
            pw.SizedBox(height: 18),
            pw.Text(
              'تفاصيل الأخطاء',
              style: headingStyle,
              textDirection: pw.TextDirection.rtl,
            ),
            pw.SizedBox(height: 10),
            if (mistakes.isEmpty)
              pw.Text(
                'لا توجد أخطاء ظاهرة.',
                style: baseStyle,
                textDirection: pw.TextDirection.rtl,
              )
            else
              ...mistakes.map(
                (mistake) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 6),
                  child: pw.Text(
                    _mistakeText(mistake),
                    style: baseStyle,
                    textDirection: pw.TextDirection.rtl,
                  ),
                ),
              ),
            pw.SizedBox(height: 20),
            pw.Text(
              'ملاحظة: هذا التقرير تقريبي ومبني على التعرف الصوتي والمطابقة التقنية.',
              style: noteStyle,
              textDirection: pw.TextDirection.rtl,
            ),
          ];
        },
      ),
    );

    final dir = await getTemporaryDirectory();

    final file = File(
      '${dir.path}/tasmee3_report_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );

    await file.writeAsBytes(await pdf.save());

    return file;
  }

  pw.Widget _infoLine(
    String label,
    String value,
    pw.TextStyle baseStyle,
    pw.TextStyle boldStyle,
  ) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 6),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            value,
            style: baseStyle,
            textDirection: pw.TextDirection.rtl,
          ),
          pw.Text(
            label,
            style: boldStyle,
            textDirection: pw.TextDirection.rtl,
          ),
        ],
      ),
    );
  }

  String _mistakeText(Tasmee3Mistake mistake) {
    switch (mistake.type) {
      case Tasmee3MistakeType.missingWord:
        return 'سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}: كلمة ناقصة: ${mistake.expectedWord ?? ''}';
      case Tasmee3MistakeType.extraWord:
        return 'سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}: كلمة زائدة: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.wrongWord:
        return 'سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}: الصحيح: ${mistake.expectedWord ?? ''}، المقروء: ${mistake.recognizedWord ?? ''}';
      case Tasmee3MistakeType.lowConfidence:
        return 'سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}: كلمة بثقة منخفضة: ${mistake.expectedWord ?? ''}';
    }
  }
}
