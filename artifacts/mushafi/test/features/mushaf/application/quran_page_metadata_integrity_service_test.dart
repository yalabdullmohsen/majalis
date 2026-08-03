import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/quran_page_metadata_integrity_service.dart';
import 'package:mushafi/features/mushaf/domain/quran_page_metadata.dart';

void main() {
  group('QuranPageMetadataIntegrityService', () {
    const service = QuranPageMetadataIntegrityService();

    test('detects invalid page count', () {
      final report = service.validate(
        const [
          QuranPageMetadata(
            pageNumber: 1,
            juz: 1,
            hizb: 1,
            rub: 1,
            fromSurah: 1,
            fromAyah: 1,
            toSurah: 1,
            toAyah: 7,
          ),
        ],
      );

      expect(report.isValid, false);
      expect(
        report.issues.any((issue) => issue.code == 'INVALID_PAGE_COUNT'),
        true,
      );
    });

    test('detects duplicate page', () {
      final report = service.validate(
        const [
          QuranPageMetadata(
            pageNumber: 1,
            juz: 1,
            hizb: 1,
            rub: 1,
            fromSurah: 1,
            fromAyah: 1,
            toSurah: 1,
            toAyah: 7,
          ),
          QuranPageMetadata(
            pageNumber: 1,
            juz: 1,
            hizb: 1,
            rub: 1,
            fromSurah: 2,
            fromAyah: 1,
            toSurah: 2,
            toAyah: 5,
          ),
        ],
      );

      expect(
        report.issues.any((issue) => issue.code == 'DUPLICATE_PAGE'),
        true,
      );
    });
  });
}
