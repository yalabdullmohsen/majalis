import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/domain/khatmah_progress.dart';

void main() {
  group('KhatmahProgress', () {
    test('calculates progress percent', () {
      final progress = KhatmahProgress(
        lastPage: 100,
        pagesRead: 302,
        totalPages: 604,
        startedAt: DateTime(2026),
        updatedAt: DateTime(2026),
      );

      expect(progress.progressPercent, 50);
    });

    test('serializes and deserializes', () {
      final progress = KhatmahProgress.initial();
      final json = progress.toJson();
      final restored = KhatmahProgress.fromJson(json);

      expect(restored.totalPages, 604);
      expect(restored.lastPage, 1);
    });
  });
}
