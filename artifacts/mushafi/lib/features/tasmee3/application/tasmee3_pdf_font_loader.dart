import 'dart:developer' as developer;

import 'package:flutter/services.dart';
import 'package:pdf/widgets.dart' as pw;

class Tasmee3PdfFonts {
  final pw.Font? regular;
  final pw.Font? bold;

  const Tasmee3PdfFonts({
    required this.regular,
    required this.bold,
  });

  bool get hasArabicFonts => regular != null && bold != null;
}

class Tasmee3PdfFontLoader {
  const Tasmee3PdfFontLoader();

  Future<Tasmee3PdfFonts> load() async {
    try {
      final regularData = await rootBundle.load(
        'assets/fonts/NotoNaskhArabic-Regular.ttf',
      );

      final boldData = await rootBundle.load(
        'assets/fonts/NotoNaskhArabic-Bold.ttf',
      );

      return Tasmee3PdfFonts(
        regular: pw.Font.ttf(regularData),
        bold: pw.Font.ttf(boldData),
      );
    } catch (e) {
      developer.log(
        'Failed to load Noto Naskh Arabic PDF fonts: $e',
        name: 'Tasmee3PdfFontLoader',
      );

      // Fallback to existing Scheherazade if available.
      try {
        final fallbackData = await rootBundle.load(
          'assets/fonts/ScheherazadeNew-Regular.ttf',
        );
        final fallback = pw.Font.ttf(fallbackData);
        return Tasmee3PdfFonts(regular: fallback, bold: fallback);
      } catch (_) {
        return const Tasmee3PdfFonts(
          regular: null,
          bold: null,
        );
      }
    }
  }
}
