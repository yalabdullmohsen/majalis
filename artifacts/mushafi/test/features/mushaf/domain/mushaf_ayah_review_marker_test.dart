import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/domain/mushaf_ayah_review_marker.dart';

void main() {
  group('MushafAyahReviewMarker', () {
    test('builds key and detects review need', () {
      final marker = MushafAyahReviewMarker(
        id: '1',
        surah: 112,
        ayah: 1,
        mistakesCount: 2,
        accuracy: 0.7,
        source: 'tasmee3',
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      expect(marker.key, '112:1');
      expect(marker.needsReview, true);
    });

    test('serializes and deserializes', () {
      final marker = MushafAyahReviewMarker(
        id: '1',
        surah: 112,
        ayah: 1,
        mistakesCount: 1,
        accuracy: 0.8,
        source: 'tasmee3',
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      final restored = MushafAyahReviewMarker.fromJson(marker.toJson());

      expect(restored.key, marker.key);
      expect(restored.mistakesCount, 1);
    });
  });
}
