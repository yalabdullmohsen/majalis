import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_review_suggestion_mapper.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_mastery_level.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_review_suggestion.dart';

void main() {
  const mapper = Tasmee3ReviewSuggestionMapper();

  test('toTarget limits range to 5 ayahs and uses hifzTest by default', () {
    final suggestion = Tasmee3ReviewSuggestion(
      ayahs: List.generate(
        8,
        (index) => AyahRef(surah: 2, ayah: index + 1),
      ),
      title: 'اختبار',
      reason: 'سبب',
      dominantLevel: AyahMasteryLevel.weak,
      estimatedMinutes: 10,
    );

    final target = mapper.toTarget(suggestion);

    expect(target.from.surah, 2);
    expect(target.from.ayah, 1);
    expect(target.to.ayah, 5);
    expect(target.mode, Tasmee3Mode.hifzTest);
  });
}
