/// تطبيع عربي للبحث ومقارنة التلاوة — لا يغيّر النص المعروض.
class ArabicNormalizer {
  ArabicNormalizer._();

  static final RegExp _tashkeel = RegExp(
    r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]',
  );

  static String removeTashkeel(String input) =>
      input.replaceAll(_tashkeel, '');

  static String normalizeHamza(String input) {
    return input
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا')
        .replaceAll('ٱ', 'ا')
        .replaceAll('ؤ', 'و')
        .replaceAll('ئ', 'ي');
  }

  static String normalizeYaAlefMaqsura(String input) {
    return input.replaceAll('ى', 'ي');
  }

  static String normalizeTaMarbuta(String input) {
    return input.replaceAll('ة', 'ه');
  }

  /// سلسلة بحث: بلا تشكيل + توحيد همزات/ياء/تاء.
  static String forSearch(String input) {
    var s = removeTashkeel(input.trim());
    s = normalizeHamza(s);
    s = normalizeYaAlefMaqsura(s);
    s = normalizeTaMarbuta(s);
    s = s.replaceAll(RegExp(r'\s+'), ' ');
    return s;
  }

  static List<String> tokenizeWords(String uthmaniOrPlain) {
    final plain = forSearch(uthmaniOrPlain);
    if (plain.isEmpty) return const [];
    return plain.split(' ').where((w) => w.isNotEmpty).toList();
  }
}
