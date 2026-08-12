class QuranIntegrityIssue {
  final String code;
  final String message;
  final int? surah;
  final int? ayah;

  const QuranIntegrityIssue({
    required this.code,
    required this.message,
    this.surah,
    this.ayah,
  });
}

class QuranIntegrityReport {
  final bool isValid;
  final int totalSurahs;
  final int totalAyahs;
  final int emptyAyahsCount;
  final int duplicateAyahsCount;
  final List<QuranIntegrityIssue> issues;
  final DateTime checkedAt;

  const QuranIntegrityReport({
    required this.isValid,
    required this.totalSurahs,
    required this.totalAyahs,
    required this.emptyAyahsCount,
    required this.duplicateAyahsCount,
    required this.issues,
    required this.checkedAt,
  });

  int get issuesCount => issues.length;

  String get statusLabel {
    if (isValid) {
      return 'ملف القرآن سليم';
    }

    return 'يوجد مشاكل في ملف القرآن';
  }
}
