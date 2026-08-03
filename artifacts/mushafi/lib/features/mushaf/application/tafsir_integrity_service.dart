import '../domain/tafsir_entry.dart';

class TafsirIntegrityIssue {
  final String code;
  final String message;
  final int? surah;
  final int? ayah;

  const TafsirIntegrityIssue({
    required this.code,
    required this.message,
    this.surah,
    this.ayah,
  });
}

class TafsirIntegrityReport {
  final bool isValid;
  final int totalEntries;
  final int emptyEntries;
  final int duplicateEntries;
  final List<TafsirIntegrityIssue> issues;

  const TafsirIntegrityReport({
    required this.isValid,
    required this.totalEntries,
    required this.emptyEntries,
    required this.duplicateEntries,
    required this.issues,
  });
}

class TafsirIntegrityService {
  const TafsirIntegrityService();

  TafsirIntegrityReport validate(List<TafsirEntry> entries) {
    final issues = <TafsirIntegrityIssue>[];

    final seen = <String>{};
    var duplicates = 0;
    var empty = 0;

    for (final entry in entries) {
      final key = entry.key;

      if (seen.contains(key)) {
        duplicates++;
        issues.add(
          TafsirIntegrityIssue(
            code: 'DUPLICATE_TAFSIR',
            message: 'تفسير مكرر للآية.',
            surah: entry.surah,
            ayah: entry.ayah,
          ),
        );
      }

      seen.add(key);

      if (entry.text.trim().isEmpty) {
        empty++;
        issues.add(
          TafsirIntegrityIssue(
            code: 'EMPTY_TAFSIR',
            message: 'تفسير فارغ.',
            surah: entry.surah,
            ayah: entry.ayah,
          ),
        );
      }

      if (entry.surah < 1 || entry.surah > 114 || entry.ayah < 1) {
        issues.add(
          TafsirIntegrityIssue(
            code: 'INVALID_REFERENCE',
            message: 'مرجع تفسير غير صحيح.',
            surah: entry.surah,
            ayah: entry.ayah,
          ),
        );
      }
    }

    return TafsirIntegrityReport(
      isValid: issues.isEmpty && entries.isNotEmpty,
      totalEntries: entries.length,
      emptyEntries: empty,
      duplicateEntries: duplicates,
      issues: issues,
    );
  }
}
