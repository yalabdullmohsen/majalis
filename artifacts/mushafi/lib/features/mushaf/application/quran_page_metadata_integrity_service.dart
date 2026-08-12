import '../domain/quran_page_metadata.dart';

class QuranPageMetadataIssue {
  final String code;
  final String message;
  final int? pageNumber;

  const QuranPageMetadataIssue({
    required this.code,
    required this.message,
    this.pageNumber,
  });
}

class QuranPageMetadataIntegrityReport {
  final bool isValid;
  final int totalPages;
  final List<QuranPageMetadataIssue> issues;

  const QuranPageMetadataIntegrityReport({
    required this.isValid,
    required this.totalPages,
    required this.issues,
  });
}

class QuranPageMetadataIntegrityService {
  const QuranPageMetadataIntegrityService();

  static const int expectedPagesCount = 604;

  QuranPageMetadataIntegrityReport validate(
    List<QuranPageMetadata> pages,
  ) {
    final issues = <QuranPageMetadataIssue>[];

    if (pages.length != expectedPagesCount) {
      issues.add(
        QuranPageMetadataIssue(
          code: 'INVALID_PAGE_COUNT',
          message:
              'عدد صفحات metadata غير صحيح. الموجود: ${pages.length}. المتوقع: $expectedPagesCount.',
        ),
      );
    }

    final seen = <int>{};

    for (final page in pages) {
      if (seen.contains(page.pageNumber)) {
        issues.add(
          QuranPageMetadataIssue(
            code: 'DUPLICATE_PAGE',
            message: 'صفحة مكررة.',
            pageNumber: page.pageNumber,
          ),
        );
      }

      seen.add(page.pageNumber);

      if (page.pageNumber < 1 || page.pageNumber > expectedPagesCount) {
        issues.add(
          QuranPageMetadataIssue(
            code: 'PAGE_OUT_OF_RANGE',
            message: 'رقم صفحة خارج النطاق.',
            pageNumber: page.pageNumber,
          ),
        );
      }

      if (page.fromSurah < 1 ||
          page.fromSurah > 114 ||
          page.toSurah < 1 ||
          page.toSurah > 114) {
        issues.add(
          QuranPageMetadataIssue(
            code: 'SURAH_OUT_OF_RANGE',
            message: 'رقم سورة خارج النطاق.',
            pageNumber: page.pageNumber,
          ),
        );
      }

      if (page.fromAyah < 1 || page.toAyah < 1) {
        issues.add(
          QuranPageMetadataIssue(
            code: 'AYAH_OUT_OF_RANGE',
            message: 'رقم آية غير صحيح.',
            pageNumber: page.pageNumber,
          ),
        );
      }

      if (page.fromSurah == page.toSurah && page.fromAyah > page.toAyah) {
        issues.add(
          QuranPageMetadataIssue(
            code: 'INVALID_AYAH_RANGE',
            message: 'نطاق الآيات داخل الصفحة غير صحيح.',
            pageNumber: page.pageNumber,
          ),
        );
      }
    }

    return QuranPageMetadataIntegrityReport(
      isValid: issues.isEmpty,
      totalPages: pages.length,
      issues: issues,
    );
  }
}
