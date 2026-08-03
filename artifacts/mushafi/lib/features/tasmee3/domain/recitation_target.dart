import 'ayah_ref.dart';

enum Tasmee3Mode {
  showText,
  hideText,
  firstWordOnly,
  hifzTest,
}

class RecitationTarget {
  final AyahRef from;
  final AyahRef to;
  final Tasmee3Mode mode;

  const RecitationTarget({
    required this.from,
    required this.to,
    required this.mode,
  });

  bool contains(AyahRef ref) {
    if (ref.surah != from.surah || ref.surah != to.surah) {
      return false;
    }

    return ref.ayah >= from.ayah && ref.ayah <= to.ayah;
  }

  bool get isValid {
    if (from.surah <= 0 || to.surah <= 0) return false;
    if (from.ayah <= 0 || to.ayah <= 0) return false;
    if (from.surah != to.surah) return false;
    if (from.ayah > to.ayah) return false;
    return true;
  }
}
