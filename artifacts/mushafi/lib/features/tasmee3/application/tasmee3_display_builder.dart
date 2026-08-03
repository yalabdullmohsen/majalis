import 'arabic_normalizer.dart';
import '../domain/quran_ayah.dart';
import '../domain/tasmee3_display_word.dart';
import '../domain/tasmee3_mistake.dart';
import '../domain/tasmee3_text_visibility_mode.dart';

class Tasmee3DisplayBuilder {
  const Tasmee3DisplayBuilder();

  List<Tasmee3DisplayWord> buildWords({
    required List<QuranAyah> ayahs,
    required List<Tasmee3Mistake> mistakes,
    required Tasmee3TextVisibilityMode visibilityMode,
    bool forceRevealAll = false,
  }) {
    final mistakesByGlobalIndex = <int, Tasmee3Mistake>{};

    for (final mistake in mistakes) {
      mistakesByGlobalIndex[mistake.globalWordIndex] = mistake;
    }

    final words = <Tasmee3DisplayWord>[];
    var globalIndex = 0;

    for (final ayah in ayahs) {
      final splitWords = ayah.textUthmani
          .split(RegExp(r'\s+'))
          .where((word) => word.trim().isNotEmpty)
          .toList();

      for (int i = 0; i < splitWords.length; i++) {
        final mistake = mistakesByGlobalIndex[globalIndex];

        final isFirstWord = i == 0;

        final shouldReveal = _shouldReveal(
          mode: visibilityMode,
          forceRevealAll: forceRevealAll,
          isFirstWord: isFirstWord,
          mistake: mistake,
        );

        words.add(
          Tasmee3DisplayWord(
            text: splitWords[i],
            ayahRef: ayah.ref,
            globalWordIndex: globalIndex,
            wordIndexInAyah: i,
            mistake: mistake,
            isRevealed: shouldReveal,
          ),
        );

        globalIndex++;
      }
    }

    return words;
  }

  bool _shouldReveal({
    required Tasmee3TextVisibilityMode mode,
    required bool forceRevealAll,
    required bool isFirstWord,
    required Tasmee3Mistake? mistake,
  }) {
    if (forceRevealAll) {
      return true;
    }

    switch (mode) {
      case Tasmee3TextVisibilityMode.showAll:
        return true;
      case Tasmee3TextVisibilityMode.hideAll:
        return false;
      case Tasmee3TextVisibilityMode.firstWordOnly:
        return isFirstWord;
      case Tasmee3TextVisibilityMode.hifzTest:
        return false;
      case Tasmee3TextVisibilityMode.revealOnMistake:
        return mistake != null;
    }
  }

  String displayTextForHiddenWord(String word) {
    final normalized = ArabicNormalizer.normalize(word);

    if (normalized.isEmpty) {
      return '•••';
    }

    final length = normalized.length.clamp(2, 8);
    return List.generate(length, (_) => '•').join();
  }
}
