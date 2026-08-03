import '../domain/ayah_ref.dart';
import '../domain/recitation_target.dart';
import '../domain/tasmee3_review_suggestion.dart';

class Tasmee3ReviewSuggestionMapper {
  const Tasmee3ReviewSuggestionMapper();

  RecitationTarget toTarget(
    Tasmee3ReviewSuggestion suggestion, {
    Tasmee3Mode mode = Tasmee3Mode.hifzTest,
  }) {
    final ayahs = suggestion.ayahs;

    if (ayahs.isEmpty) {
      return RecitationTarget(
        from: const AyahRef(surah: 112, ayah: 1),
        to: const AyahRef(surah: 112, ayah: 4),
        mode: mode,
      );
    }

    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.surah.compareTo(b.surah);

      if (surahCompare != 0) {
        return surahCompare;
      }

      return a.ayah.compareTo(b.ayah);
    });

    final first = sorted.first;
    final last = sorted.last;

    if (first.surah != last.surah) {
      return RecitationTarget(
        from: first,
        to: first,
        mode: mode,
      );
    }

    final limitedLast = AyahRef(
      surah: first.surah,
      ayah: (first.ayah + 4) < last.ayah ? first.ayah + 4 : last.ayah,
    );

    return RecitationTarget(
      from: first,
      to: limitedLast,
      mode: mode,
    );
  }
}
