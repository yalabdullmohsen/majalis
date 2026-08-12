import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

class Tasmee3ReportPreviewScreen extends StatelessWidget {
  final String reportText;
  final String? pdfPath;

  const Tasmee3ReportPreviewScreen({
    super.key,
    required this.reportText,
    this.pdfPath,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFBF7EF),
        appBar: AppBar(
          title: const Text('معاينة التقرير'),
          centerTitle: true,
          backgroundColor: const Color(0xFFFBF7EF),
          foregroundColor: const Color(0xFF11100E),
          elevation: 0,
          actions: [
            if (pdfPath != null)
              IconButton(
                tooltip: 'مشاركة PDF',
                icon: const Icon(Icons.share),
                onPressed: () async {
                  await Share.shareXFiles(
                    [XFile(pdfPath!)],
                    text: 'تقرير جلسة التسميع',
                    subject: 'تقرير جلسة التسميع',
                  );
                },
              ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFCF7),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE0C5A3)),
              ),
              child: Text(
                reportText,
                style: const TextStyle(
                  height: 1.7,
                  fontSize: 15,
                  color: Color(0xFF11100E),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
