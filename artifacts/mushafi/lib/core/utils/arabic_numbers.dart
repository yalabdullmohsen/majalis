/// تحويل الأرقام بين الهندية والعربية الغربية.
enum DigitStyle { easternArabic, western }

class ArabicNumbers {
  ArabicNumbers._();

  static const _eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  static String format(int value, {DigitStyle style = DigitStyle.easternArabic}) {
    final raw = value.toString();
    if (style == DigitStyle.western) return raw;
    final buf = StringBuffer();
    for (final ch in raw.split('')) {
      final d = int.tryParse(ch);
      buf.write(d == null ? ch : _eastern[d]);
    }
    return buf.toString();
  }

  static String juzLabel(int juz, {DigitStyle style = DigitStyle.easternArabic}) =>
      'الجزء ${format(juz, style: style)}';

  static String pageLabel(int page, {DigitStyle style = DigitStyle.easternArabic}) =>
      format(page, style: style);

  static String hizbHalfLabel(int hizb, {DigitStyle style = DigitStyle.easternArabic}) =>
      'نصف الحزب ${format(hizb, style: style)}';
}
