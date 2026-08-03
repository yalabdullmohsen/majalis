import 'package:mushafi/core/constants/app_constants.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';
import 'package:mushafi/features/quran/domain/entities/surah.dart';
import 'package:mushafi/features/quran/domain/repositories/quran_repository.dart';

class QuranIntegrityChecker {
  IntegrityReport check({
    required List<Surah> surahs,
    required List<Ayah> ayahs,
    required bool isMock,
  }) {
    final issues = <String>[];

    if (isMock) {
      issues.add(
        'بيانات MOCK: ليست مصحفًا كاملاً — استبدل assets/data/quran_uthmani.json بمصدر مرخّص.',
      );
    }

    if (!isMock && surahs.length != AppConstants.expectedSurahCount) {
      issues.add('عدد السور ${surahs.length} ≠ ${AppConstants.expectedSurahCount}');
    }

    if (!isMock && ayahs.length != AppConstants.expectedAyahCountHafs) {
      issues.add(
        'إجمالي الآيات ${ayahs.length} ≠ ${AppConstants.expectedAyahCountHafs}',
      );
    }

    for (final a in ayahs) {
      if (a.textUthmani.trim().isEmpty) {
        issues.add('آية فارغة: ${a.key}');
      }
      if (a.pageNumber < 1) issues.add('pageNumber غير صالح: ${a.key}');
      if (a.juzNumber < 1 || a.juzNumber > 30) {
        issues.add('juzNumber غير صالح: ${a.key}');
      }
      if (a.hizbQuarter < 1 || a.hizbQuarter > 240) {
        issues.add('hizbQuarter غير صالح: ${a.key}');
      }
    }

    for (final s in surahs) {
      if (s.id == 9 && s.bismillahPre) {
        issues.add('سورة التوبة يجب ألا تسبقها بسملة (bismillahPre=false)');
      }
      if (s.id != 9 && s.id != 1 && !s.bismillahPre && !isMock) {
        issues.add('سورة ${s.id} يُتوقع لها bismillahPre=true');
      }
    }

    final ok = isMock
        ? ayahs.isNotEmpty && surahs.isNotEmpty && !ayahs.any((a) => a.textUthmani.trim().isEmpty)
        : issues.isEmpty;

    return IntegrityReport(
      ok: ok,
      surahCount: surahs.length,
      ayahCount: ayahs.length,
      issues: issues,
      isMock: isMock,
    );
  }
}
