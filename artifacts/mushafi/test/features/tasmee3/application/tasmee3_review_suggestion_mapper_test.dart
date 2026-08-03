import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_review_suggestion_mapper.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_mastery_level.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_review_suggestion.dart';

void main() {
  group('Tasmee3ReviewSuggestionMapper', () {
    const mapper = Tasmee3ReviewSuggestionMapper();

    test('maps suggestion to target', () {
      const suggestion = Tasmee3ReviewSuggestion(
        ayahs: [
          AyahRef(surah: 112, ayah: 1),
          AyahRef(surah: 112, ayah: 2),
          AyahRef(surah: 112, ayah: 3),
        ],
        title: 'مراجعة',
        reason: 'اختبار',
        dominantLevel: AyahMasteryLevel.weak,
        estimatedMinutes: 5,
      );

      final target = mapper.toTarget(
        suggestion,
        mode: Tasmee3Mode.hifzTest,
      );

      expect(target.from.ayah, 1);
      expect(target.to.ayah, 3);
      expect(target.mode, Tasmee3Mode.hifzTest);
    });

    test('limits long range to 5 ayahs', () {
      final suggestion = Tasmee3ReviewSuggestion(
        ayahs: List.generate(
          10,
          (index) => AyahRef(surah: 2, ayah: index + 1),
        ),
        title: 'مراجعة',
        reason: 'اختبار',
        dominantLevel: AyahMasteryLevel.weak,
        estimatedMinutes: 10,
      );

      final target = mapper.toTarget(suggestion);

      expect(target.from.ayah, 1);
      expect(target.to.ayah, 5);
    });
  });
}
