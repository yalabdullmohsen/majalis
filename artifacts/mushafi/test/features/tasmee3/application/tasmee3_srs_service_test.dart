import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_srs_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_result.dart';

void main() {
  group('Tasmee3SrsService', () {
    const service = Tasmee3SrsService();

    test('updates mastery from session', () {
      final updated = service.updateMasteryFromSession(
        currentRecords: const [],
        target: const RecitationTarget(
          from: AyahRef(surah: 112, ayah: 1),
          to: AyahRef(surah: 112, ayah: 2),
          mode: Tasmee3Mode.hifzTest,
        ),
        result: const Tasmee3Result(
          expectedWords: ['قل', 'هو', 'الله', 'احد'],
          recognizedWords: ['قل', 'هو', 'الله', 'احد'],
          mistakes: [],
          accuracy: 1,
        ),
      );

      expect(updated.length, 2);
      expect(updated.first.reviewCount, 1);
      expect(updated.first.masteryScore, greaterThan(0));
    });

    test('returns no suggestions when no records exist', () {
      final suggestions = service.buildTodaySuggestions(const []);

      expect(suggestions, isEmpty);
    });
  });
}
