import 'ayah_ref.dart';
import 'tasmee3_mistake.dart';

class Tasmee3DisplayWord {
  final String text;
  final AyahRef ayahRef;
  final int globalWordIndex;
  final int wordIndexInAyah;
  final Tasmee3Mistake? mistake;
  final bool isRevealed;

  const Tasmee3DisplayWord({
    required this.text,
    required this.ayahRef,
    required this.globalWordIndex,
    required this.wordIndexInAyah,
    required this.mistake,
    required this.isRevealed,
  });

  bool get hasMistake => mistake != null;
}
