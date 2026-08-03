import 'ayah_ref.dart';
import 'ayah_mastery_level.dart';

class Tasmee3ReviewSuggestion {
  final List<AyahRef> ayahs;
  final String title;
  final String reason;
  final AyahMasteryLevel dominantLevel;
  final int estimatedMinutes;

  const Tasmee3ReviewSuggestion({
    required this.ayahs,
    required this.title,
    required this.reason,
    required this.dominantLevel,
    required this.estimatedMinutes,
  });

  AyahRef get from => ayahs.first;

  AyahRef get to => ayahs.last;

  String get rangeLabel {
    if (ayahs.isEmpty) {
      return '';
    }

    if (from.surah == to.surah && from.ayah == to.ayah) {
      return 'سورة ${from.surah} آية ${from.ayah}';
    }

    if (from.surah == to.surah) {
      return 'سورة ${from.surah} من آية ${from.ayah} إلى ${to.ayah}';
    }

    return 'من سورة ${from.surah} آية ${from.ayah} إلى سورة ${to.surah} آية ${to.ayah}';
  }
}
