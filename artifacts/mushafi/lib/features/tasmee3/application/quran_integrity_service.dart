import '../domain/quran_ayah.dart';
import '../domain/quran_integrity_report.dart';

class QuranIntegrityService {
  const QuranIntegrityService();

  static const int expectedSurahsCount = 114;
  static const int expectedAyahsCount = 6236;

  QuranIntegrityReport validate(List<QuranAyah> ayahs) {
    final issues = <QuranIntegrityIssue>[];

    final surahs = ayahs.map((ayah) => ayah.ref.surah).toSet();

    if (surahs.length != expectedSurahsCount) {
      issues.add(
        QuranIntegrityIssue(
          code: 'INVALID_SURAHS_COUNT',
          message:
              'عدد السور غير صحيح. الموجود: ${surahs.length}. المتوقع: $expectedSurahsCount.',
        ),
      );
    }

    if (ayahs.length != expectedAyahsCount) {
      issues.add(
        QuranIntegrityIssue(
          code: 'INVALID_AYAHS_COUNT',
          message:
              'عدد الآيات غير صحيح. الموجود: ${ayahs.length}. المتوقع: $expectedAyahsCount.',
        ),
      );
    }

    final emptyAyahs = ayahs.where((ayah) {
      return ayah.textUthmani.trim().isEmpty;
    }).toList();

    for (final ayah in emptyAyahs) {
      issues.add(
        QuranIntegrityIssue(
          code: 'EMPTY_AYAH',
          message: 'آية فارغة.',
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        ),
      );
    }

    final seen = <String>{};
    final duplicates = <QuranAyah>[];

    for (final ayah in ayahs) {
      final key = ayah.ref.key;

      if (seen.contains(key)) {
        duplicates.add(ayah);
      } else {
        seen.add(key);
      }
    }

    for (final ayah in duplicates) {
      issues.add(
        QuranIntegrityIssue(
          code: 'DUPLICATE_AYAH',
          message: 'آية مكررة في ملف القرآن.',
          surah: ayah.ref.surah,
          ayah: ayah.ref.ayah,
        ),
      );
    }

    issues.addAll(_validateOrdering(ayahs));
    issues.addAll(_validateKnownSurahLengths(ayahs));

    return QuranIntegrityReport(
      isValid: issues.isEmpty,
      totalSurahs: surahs.length,
      totalAyahs: ayahs.length,
      emptyAyahsCount: emptyAyahs.length,
      duplicateAyahsCount: duplicates.length,
      issues: issues,
      checkedAt: DateTime.now(),
    );
  }

  List<QuranIntegrityIssue> _validateOrdering(List<QuranAyah> ayahs) {
    final issues = <QuranIntegrityIssue>[];

    var previousSurah = 0;
    var previousAyah = 0;

    for (final item in ayahs) {
      final currentSurah = item.ref.surah;
      final currentAyah = item.ref.ayah;

      if (previousSurah != 0 && currentSurah < previousSurah) {
        issues.add(
          QuranIntegrityIssue(
            code: 'INVALID_ORDER',
            message: 'ترتيب السور غير صحيح.',
            surah: currentSurah,
            ayah: currentAyah,
          ),
        );
      }

      if (previousSurah != 0 &&
          currentSurah == previousSurah &&
          currentAyah <= previousAyah) {
        issues.add(
          QuranIntegrityIssue(
            code: 'INVALID_AYAH_ORDER',
            message: 'ترتيب الآيات داخل السورة غير صحيح.',
            surah: currentSurah,
            ayah: currentAyah,
          ),
        );
      }

      // عند تغيير السورة نخزّن الآية الحالية كأساس جديد (previousAyah يُحدَّث أدناه).
      previousSurah = currentSurah;
      previousAyah = currentAyah;
    }

    return issues;
  }

  List<QuranIntegrityIssue> _validateKnownSurahLengths(List<QuranAyah> ayahs) {
    final expected = <int, int>{
      1: 7,
      2: 286,
      3: 200,
      4: 176,
      5: 120,
      6: 165,
      7: 206,
      8: 75,
      9: 129,
      10: 109,
      11: 123,
      12: 111,
      13: 43,
      14: 52,
      15: 99,
      16: 128,
      17: 111,
      18: 110,
      19: 98,
      20: 135,
      21: 112,
      22: 78,
      23: 118,
      24: 64,
      25: 77,
      26: 227,
      27: 93,
      28: 88,
      29: 69,
      30: 60,
      31: 34,
      32: 30,
      33: 73,
      34: 54,
      35: 45,
      36: 83,
      37: 182,
      38: 88,
      39: 75,
      40: 85,
      41: 54,
      42: 53,
      43: 89,
      44: 59,
      45: 37,
      46: 35,
      47: 38,
      48: 29,
      49: 18,
      50: 45,
      51: 60,
      52: 49,
      53: 62,
      54: 55,
      55: 78,
      56: 96,
      57: 29,
      58: 22,
      59: 24,
      60: 13,
      61: 14,
      62: 11,
      63: 11,
      64: 18,
      65: 12,
      66: 12,
      67: 30,
      68: 52,
      69: 52,
      70: 44,
      71: 28,
      72: 28,
      73: 20,
      74: 56,
      75: 40,
      76: 31,
      77: 50,
      78: 40,
      79: 46,
      80: 42,
      81: 29,
      82: 19,
      83: 36,
      84: 25,
      85: 22,
      86: 17,
      87: 19,
      88: 26,
      89: 30,
      90: 20,
      91: 15,
      92: 21,
      93: 11,
      94: 8,
      95: 8,
      96: 19,
      97: 5,
      98: 8,
      99: 8,
      100: 11,
      101: 11,
      102: 8,
      103: 3,
      104: 9,
      105: 5,
      106: 4,
      107: 7,
      108: 3,
      109: 6,
      110: 3,
      111: 5,
      112: 4,
      113: 5,
      114: 6,
    };

    final issues = <QuranIntegrityIssue>[];

    for (final entry in expected.entries) {
      final surah = entry.key;
      final expectedCount = entry.value;
      final actualCount = ayahs.where((ayah) => ayah.ref.surah == surah).length;

      if (actualCount != expectedCount) {
        issues.add(
          QuranIntegrityIssue(
            code: 'INVALID_SURAH_LENGTH',
            message:
                'عدد آيات السورة $surah غير صحيح. الموجود: $actualCount. المتوقع: $expectedCount.',
            surah: surah,
          ),
        );
      }
    }

    return issues;
  }
}
