import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/application/tafsir_integrity_service.dart';
import 'package:mushafi/features/mushaf/domain/tafsir_entry.dart';

void main() {
  group('TafsirIntegrityService', () {
    const service = TafsirIntegrityService();

    test('detects empty tafsir list as invalid', () {
      final report = service.validate(const []);

      expect(report.isValid, false);
      expect(report.totalEntries, 0);
    });

    test('detects empty tafsir entry', () {
      final report = service.validate(
        const [
          TafsirEntry(surah: 1, ayah: 1, text: ''),
        ],
      );

      expect(report.isValid, false);
      expect(
        report.issues.any((issue) => issue.code == 'EMPTY_TAFSIR'),
        true,
      );
    });

    test('accepts valid entry', () {
      final report = service.validate(
        const [
          TafsirEntry(
            surah: 1,
            ayah: 1,
            text: 'تفسير تجريبي للاختبار فقط.',
          ),
        ],
      );

      expect(report.isValid, true);
    });
  });
}
