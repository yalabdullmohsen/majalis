import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/quran_integrity_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';

void main() {
  test('assets/quran/quran_uthmani.json passes integrity checks', () {
    final file = File('assets/quran/quran_uthmani.json');
    expect(file.existsSync(), isTrue);

    final decoded = jsonDecode(file.readAsStringSync());
    expect(decoded, isA<List>());

    final rawAyahs = (decoded as List).cast<Map<String, dynamic>>();

    for (final item in rawAyahs) {
      expect(item.containsKey('surah'), isTrue);
      expect(item.containsKey('ayah'), isTrue);
      expect(item.containsKey('textUthmani'), isTrue);
      expect('${item['textUthmani']}'.trim().isNotEmpty, isTrue);
    }

    final ayahs = rawAyahs
        .map(
          (item) => QuranAyah(
            ref: AyahRef(
              surah: item['surah'] as int,
              ayah: item['ayah'] as int,
            ),
            textUthmani: item['textUthmani'] as String,
          ),
        )
        .toList();

    const service = QuranIntegrityService();
    final report = service.validate(ayahs);

    expect(report.totalSurahs, QuranIntegrityService.expectedSurahsCount);
    expect(report.totalAyahs, QuranIntegrityService.expectedAyahsCount);
    expect(report.emptyAyahsCount, 0);
    expect(report.duplicateAyahsCount, 0);
    expect(report.isValid, isTrue, reason: report.issues.toString());
  });
}
