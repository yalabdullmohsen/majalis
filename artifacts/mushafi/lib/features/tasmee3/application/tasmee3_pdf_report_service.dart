import 'dart:io';

import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../domain/recitation_target.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_result.dart';
import 'tasmee3_pdf_font_loader.dart';

class Tasmee3PdfReportService {
  final Tasmee3PdfFontLoader fontLoader;

  const Tasmee3PdfReportService({
    required this.fontLoader,
  });

  Future<File> buildSessionPdf({
    required RecitationTarget target,
    required Tasmee3Result result,
    required int durationSeconds,
  }) async {
    final fonts = await fontLoader.load();

    final pdf = pw.Document(
      title: 'تقرير جلسة التسميع',
      author: 'Tasmee3',
      subject: 'تقرير مراجعة الحفظ والتسميع',
      creator: 'Tasmee3 Feature',
    );

    final now = DateTime.now();
    final reportDate = DateFormat('yyyy-MM-dd HH:mm').format(now);
    final reportId = now.microsecondsSinceEpoch.toString();

    final mistakes = result.mistakes.where((mistake) {
      return mistake.type == Tasmee3MistakeType.missingWord ||
          mistake.type == Tasmee3MistakeType.extraWord ||
          mistake.type == Tasmee3MistakeType.wrongWord ||
          mistake.type == Tasmee3MistakeType.lowConfidence;
    }).toList();

    final pw.ThemeData? theme = fonts.hasArabicFonts
        ? pw.ThemeData.withFont(
            base: fonts.regular!,
            bold: fonts.bold!,
          )
        : null;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        textDirection: pw.TextDirection.rtl,
        theme: theme,
        margin: const pw.EdgeInsets.all(28),
        build: (context) {
          return [
            _header(
              fonts: fonts,
              reportDate: reportDate,
              reportId: reportId,
            ),
            pw.SizedBox(height: 18),
            _summaryBox(
              fonts: fonts,
              target: target,
              result: result,
              durationSeconds: durationSeconds,
            ),
            pw.SizedBox(height: 18),
            _sectionTitle('تفاصيل الأخطاء', fonts),
            pw.SizedBox(height: 8),
            if (mistakes.isEmpty)
              _emptyMistakesBox(fonts)
            else
              _mistakesTable(mistakes, fonts),
            pw.SizedBox(height: 18),
            _sectionTitle('نصائح للمراجعة', fonts),
            pw.SizedBox(height: 8),
            _reviewTips(result, fonts),
            pw.SizedBox(height: 20),
            _footerNote(fonts),
          ];
        },
        footer: (context) {
          return pw.Container(
            alignment: pw.Alignment.center,
            margin: const pw.EdgeInsets.only(top: 12),
            child: _text(
              'صفحة ${context.pageNumber} من ${context.pagesCount}',
              fonts,
              fontSize: 9,
              color: PdfColors.grey700,
            ),
          );
        },
      ),
    );

    final dir = await getTemporaryDirectory();

    final file = File(
      '${dir.path}/tasmee3_report_$reportId.pdf',
    );

    await file.writeAsBytes(await pdf.save());

    return file;
  }

  pw.Widget _header({
    required Tasmee3PdfFonts fonts,
    required String reportDate,
    required String reportId,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(16),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#FBF7EF'),
        borderRadius: pw.BorderRadius.circular(14),
        border: pw.Border.all(
          color: PdfColor.fromHex('#A77A48'),
          width: 1,
        ),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          _text(
            'تقرير جلسة التسميع',
            fonts,
            fontSize: 24,
            bold: true,
            color: PdfColor.fromHex('#11100E'),
          ),
          pw.SizedBox(height: 6),
          _text(
            'تقرير تقريبي لمراجعة الحفظ بناء على التعرف الصوتي والمطابقة التقنية.',
            fonts,
            fontSize: 11,
            color: PdfColor.fromHex('#6F6258'),
          ),
          pw.SizedBox(height: 10),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              _text('تاريخ التقرير: $reportDate', fonts, fontSize: 10),
              _text('رقم التقرير: $reportId', fonts, fontSize: 10),
            ],
          ),
        ],
      ),
    );
  }

  pw.Widget _summaryBox({
    required Tasmee3PdfFonts fonts,
    required RecitationTarget target,
    required Tasmee3Result result,
    required int durationSeconds,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#FFFCF7'),
        borderRadius: pw.BorderRadius.circular(12),
        border: pw.Border.all(color: PdfColor.fromHex('#E0C5A3')),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          _sectionTitle('ملخص الجلسة', fonts),
          pw.SizedBox(height: 10),
          _infoRow('السورة', '${target.from.surah}', fonts),
          _infoRow('من آية', '${target.from.ayah}', fonts),
          _infoRow('إلى آية', '${target.to.ayah}', fonts),
          _infoRow('المدة', '$durationSeconds ثانية', fonts),
          _infoRow('الدقة التقريبية', '${result.accuracyPercent}%', fonts),
          _infoRow('عدد الأخطاء', '${result.mistakesCount}', fonts),
          _infoRow(
            'عدد الكلمات المتوقعة',
            '${result.expectedWords.length}',
            fonts,
          ),
          _infoRow(
            'عدد الكلمات المتعرف عليها',
            '${result.recognizedWords.length}',
            fonts,
          ),
        ],
      ),
    );
  }

  pw.Widget _mistakesTable(
    List<Tasmee3Mistake> mistakes,
    Tasmee3PdfFonts fonts,
  ) {
    final rows = mistakes.map((mistake) {
      return [
        _mistakeTypeLabel(mistake.type),
        'سورة ${mistake.ayahRef.surah} آية ${mistake.ayahRef.ayah}',
        mistake.expectedWord ?? '',
        mistake.recognizedWord ?? '',
        '${(mistake.confidence * 100).round()}%',
      ];
    }).toList();

    return pw.TableHelper.fromTextArray(
      headers: [
        'نوع الخطأ',
        'الموضع',
        'المتوقع',
        'المقروء',
        'الثقة',
      ],
      data: rows,
      headerStyle: pw.TextStyle(
        font: fonts.bold,
        fontSize: 10,
        color: PdfColors.white,
        fontWeight: pw.FontWeight.bold,
      ),
      headerDecoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#A77A48'),
      ),
      cellStyle: pw.TextStyle(
        font: fonts.regular,
        fontSize: 9,
      ),
      cellAlignment: pw.Alignment.centerRight,
      headerAlignment: pw.Alignment.centerRight,
      border: pw.TableBorder.all(
        color: PdfColor.fromHex('#E0C5A3'),
        width: 0.5,
      ),
      cellPadding: const pw.EdgeInsets.all(6),
    );
  }

  pw.Widget _emptyMistakesBox(Tasmee3PdfFonts fonts) {
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#F0F8EF'),
        borderRadius: pw.BorderRadius.circular(10),
        border: pw.Border.all(color: PdfColors.green300),
      ),
      child: _text(
        'لا توجد أخطاء ظاهرة في هذه الجلسة.',
        fonts,
        fontSize: 12,
        color: PdfColors.green800,
      ),
    );
  }

  pw.Widget _reviewTips(
    Tasmee3Result result,
    Tasmee3PdfFonts fonts,
  ) {
    final tips = <String>[];

    if (result.accuracyPercent >= 90) {
      tips.add('حافظ على نفس النطاق وراجعه لاحقا للتثبيت.');
      tips.add('يمكنك زيادة النطاق تدريجيا في الجلسة القادمة.');
    } else if (result.accuracyPercent >= 75) {
      tips.add('راجع الكلمات الملونة بالأحمر أو البرتقالي.');
      tips.add('أعد التسميع على نفس النطاق مرة أخرى.');
    } else {
      tips.add('قلل النطاق إلى آية واحدة أو آيتين.');
      tips.add('استمع لتلاوة متقنة ثم أعد التسميع.');
      tips.add('اقرأ في مكان هادئ وبصوت واضح.');
    }

    if (result.hasLowConfidence) {
      tips.add(
        'ظهرت كلمات بثقة منخفضة، حاول تقريب الجهاز أو تقليل الضوضاء.',
      );
    }

    return pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#FFFCF7'),
        borderRadius: pw.BorderRadius.circular(10),
        border: pw.Border.all(color: PdfColor.fromHex('#E0C5A3')),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: tips.map((tip) {
          return pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 6),
            child: _text('• $tip', fonts, fontSize: 11),
          );
        }).toList(),
      ),
    );
  }

  pw.Widget _footerNote(Tasmee3PdfFonts fonts) {
    return _text(
      'تنبيه: هذا التقرير أداة مساعدة تقنية للمراجعة، وليس حكما شرعيا على التلاوة. النص القرآني لا يتم توليده بالذكاء الاصطناعي.',
      fonts,
      fontSize: 9,
      color: PdfColors.grey700,
    );
  }

  pw.Widget _sectionTitle(String title, Tasmee3PdfFonts fonts) {
    return _text(
      title,
      fonts,
      fontSize: 16,
      bold: true,
      color: PdfColor.fromHex('#11100E'),
    );
  }

  pw.Widget _infoRow(
    String label,
    String value,
    Tasmee3PdfFonts fonts,
  ) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 7),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          _text(value, fonts, fontSize: 11),
          _text(label, fonts, fontSize: 11, bold: true),
        ],
      ),
    );
  }

  pw.Widget _text(
    String value,
    Tasmee3PdfFonts fonts, {
    double fontSize = 12,
    bool bold = false,
    PdfColor? color,
  }) {
    return pw.Text(
      value,
      textDirection: pw.TextDirection.rtl,
      style: pw.TextStyle(
        font: bold ? fonts.bold : fonts.regular,
        fontSize: fontSize,
        fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
        color: color,
      ),
    );
  }

  String _mistakeTypeLabel(Tasmee3MistakeType type) {
    switch (type) {
      case Tasmee3MistakeType.missingWord:
        return 'كلمة ناقصة';
      case Tasmee3MistakeType.extraWord:
        return 'كلمة زائدة';
      case Tasmee3MistakeType.wrongWord:
        return 'كلمة غير مطابقة';
      case Tasmee3MistakeType.lowConfidence:
        return 'ثقة منخفضة';
    }
  }
}
