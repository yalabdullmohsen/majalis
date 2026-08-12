class ArabicNormalizer {
  static final RegExp _tashkeel = RegExp(
    r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]',
  );

  static final RegExp _tatweel = RegExp(r'ـ');
  static final RegExp _nonArabic = RegExp(r'[^\u0621-\u064A\s]');
  static final RegExp _spaces = RegExp(r'\s+');

  static String normalize(String input) {
    var text = input.trim();

    text = text.replaceAll(_tatweel, '');
    text = text.replaceAll(_tashkeel, '');

    text = text.replaceAll('ٱ', 'ا');
    text = text.replaceAll('آ', 'ا');
    text = text.replaceAll('أ', 'ا');
    text = text.replaceAll('إ', 'ا');

    text = text.replaceAll('ى', 'ي');
    text = text.replaceAll('ؤ', 'و');
    text = text.replaceAll('ئ', 'ي');

    text = text.replaceAll('ة', 'ه');

    text = text.replaceAll(_nonArabic, ' ');
    text = text.replaceAll(_spaces, ' ');

    return text.trim();
  }

  static List<String> tokenize(String input) {
    final normalized = normalize(input);

    if (normalized.isEmpty) {
      return const [];
    }

    return normalized
        .split(' ')
        .where((word) => word.trim().isNotEmpty)
        .toList();
  }
}
