import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/quran_integrity_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  group('QuranIntegrityService', () {
    const service = QuranIntegrityService();

    test('detects empty quran file', () {
      final report = service.validate(const []);

      expect(report.isValid, false);
      expect(report.issues, isNotEmpty);
    });

    test('detects empty ayah', () {
      final report = service.validate(
        const [
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 1),
            textUthmani: '',
          ),
        ],
      );

      expect(report.isValid, false);
      expect(
        report.issues.any((issue) => issue.code == 'EMPTY_AYAH'),
        true,
      );
    });

    test('detects duplicate ayah', () {
      final report = service.validate(
        const [
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 1),
            textUthmani: 'بسم الله الرحمن الرحيم',
          ),
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 1),
            textUthmani: 'بسم الله الرحمن الرحيم',
          ),
        ],
      );

      expect(report.isValid, false);
      expect(
        report.issues.any((issue) => issue.code == 'DUPLICATE_AYAH'),
        true,
      );
    });

    test('detects invalid ayah order within surah', () {
      final report = service.validate(
        const [
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 2),
            textUthmani: 'الثانية',
          ),
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 1),
            textUthmani: 'الأولى',
          ),
        ],
      );

      expect(
        report.issues.any((issue) => issue.code == 'INVALID_AYAH_ORDER'),
        true,
      );
    });

    test('detects invalid surah order', () {
      final report = service.validate(
        const [
          QuranAyah(
            ref: AyahRef(surah: 2, ayah: 1),
            textUthmani: 'نص',
          ),
          QuranAyah(
            ref: AyahRef(surah: 1, ayah: 1),
            textUthmani: 'نص',
          ),
        ],
      );

      expect(
        report.issues.any((issue) => issue.code == 'INVALID_ORDER'),
        true,
      );
    });
  });
}
