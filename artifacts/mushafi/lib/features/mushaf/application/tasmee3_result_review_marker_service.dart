import '../../tasmee3/domain/recitation_target.dart';
import '../../tasmee3/domain/tasmee3_mistake.dart';
import '../../tasmee3/domain/tasmee3_result.dart';
import '../domain/mushaf_ayah_review_marker.dart';

class Tasmee3ResultReviewMarkerService {
  const Tasmee3ResultReviewMarkerService();

  List<MushafAyahReviewMarker> buildMarkers({
    required RecitationTarget target,
    required Tasmee3Result result,
  }) {
    final mistakesByAyah = <String, int>{};

    for (final mistake in result.mistakes) {
      if (_isRealMistake(mistake.type)) {
        final key = mistake.ayahRef.key;
        mistakesByAyah[key] = (mistakesByAyah[key] ?? 0) + 1;
      }
    }

    final markers = <MushafAyahReviewMarker>[];
    final now = DateTime.now();

    for (final entry in mistakesByAyah.entries) {
      final parts = entry.key.split(':');

      if (parts.length != 2) {
        continue;
      }

      final surah = int.tryParse(parts[0]);
      final ayah = int.tryParse(parts[1]);

      if (surah == null || ayah == null) {
        continue;
      }

      markers.add(
        MushafAyahReviewMarker(
          id: '${surah}_${ayah}_${now.microsecondsSinceEpoch}',
          surah: surah,
          ayah: ayah,
          mistakesCount: entry.value,
          accuracy: result.accuracy,
          source: 'tasmee3',
          createdAt: now,
          updatedAt: now,
        ),
      );
    }

    return markers;
  }

  bool shouldClearMarkers(Tasmee3Result result) {
    return result.accuracy >= 0.95 && result.mistakesCount == 0;
  }

  bool _isRealMistake(Tasmee3MistakeType type) {
    return type == Tasmee3MistakeType.missingWord ||
        type == Tasmee3MistakeType.wrongWord ||
        type == Tasmee3MistakeType.lowConfidence;
  }
}
