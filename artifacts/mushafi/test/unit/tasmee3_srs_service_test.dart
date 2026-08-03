import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_srs_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_mastery_level.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_mastery_record.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_mistake.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_result.dart';

void main() {
  const service = Tasmee3SrsService();

  test('updateMasteryFromSession marks ayah weak after mistakes', () {
    final target = RecitationTarget(
      from: const AyahRef(surah: 1, ayah: 1),
      to: const AyahRef(surah: 1, ayah: 2),
      mode: Tasmee3Mode.showText,
    );

    final result = Tasmee3Result(
      expectedWords: const ['بسم', 'الله'],
      recognizedWords: const ['بسم'],
      mistakes: [
        Tasmee3Mistake(
          type: Tasmee3MistakeType.missingWord,
          ayahRef: const AyahRef(surah: 1, ayah: 1),
          globalWordIndex: 1,
          wordIndexInAyah: 1,
          expectedWord: 'الله',
          confidence: 0.9,
        ),
      ],
      accuracy: 0.5,
    );

    final updated = service.updateMasteryFromSession(
      currentRecords: const [],
      target: target,
      result: result,
    );

    expect(updated.length, 2);
    final first = updated.firstWhere((r) => r.ayahRef.ayah == 1);
    expect(first.reviewCount, 1);
    expect(first.mistakeCount, 1);
    expect(first.level, AyahMasteryLevel.weak);
    expect(first.nextReviewAt.isAfter(DateTime.now()), isTrue);
  });

  test('buildTodaySuggestions groups due ayahs', () {
    final now = DateTime.now();
    final records = [
      AyahMasteryRecord(
        ayahRef: const AyahRef(surah: 2, ayah: 1),
        level: AyahMasteryLevel.weak,
        masteryScore: 0.4,
        reviewCount: 2,
        mistakeCount: 3,
        consecutiveSuccesses: 0,
        lastReviewedAt: now.subtract(const Duration(days: 1)),
        nextReviewAt: now.subtract(const Duration(hours: 1)),
      ),
      AyahMasteryRecord(
        ayahRef: const AyahRef(surah: 2, ayah: 2),
        level: AyahMasteryLevel.learning,
        masteryScore: 0.65,
        reviewCount: 1,
        mistakeCount: 1,
        consecutiveSuccesses: 0,
        lastReviewedAt: now.subtract(const Duration(days: 1)),
        nextReviewAt: now.subtract(const Duration(hours: 1)),
      ),
    ];

    final suggestions = service.buildTodaySuggestions(records);
    expect(suggestions, isNotEmpty);
    expect(suggestions.first.ayahs.length, greaterThanOrEqualTo(1));
  });
}
