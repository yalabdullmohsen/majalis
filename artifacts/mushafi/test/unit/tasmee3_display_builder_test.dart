import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_display_builder.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_mistake.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_text_visibility_mode.dart';

void main() {
  const builder = Tasmee3DisplayBuilder();

  final ayahs = [
    const QuranAyah(
      ref: AyahRef(surah: 112, ayah: 1),
      textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    ),
  ];

  test('firstWordOnly reveals only the first word', () {
    final words = builder.buildWords(
      ayahs: ayahs,
      mistakes: const [],
      visibilityMode: Tasmee3TextVisibilityMode.firstWordOnly,
    );

    expect(words, isNotEmpty);
    expect(words.first.isRevealed, isTrue);
    expect(words.skip(1).every((word) => !word.isRevealed), isTrue);
  });

  test('revealOnMistake reveals mistaken words only', () {
    final words = builder.buildWords(
      ayahs: ayahs,
      mistakes: [
        const Tasmee3Mistake(
          type: Tasmee3MistakeType.wrongWord,
          ayahRef: AyahRef(surah: 112, ayah: 1),
          globalWordIndex: 1,
          wordIndexInAyah: 1,
          expectedWord: 'هُوَ',
          recognizedWord: 'هي',
          confidence: 0.4,
        ),
      ],
      visibilityMode: Tasmee3TextVisibilityMode.revealOnMistake,
    );

    expect(words[1].isRevealed, isTrue);
    expect(words[1].hasMistake, isTrue);
    expect(words.first.isRevealed, isFalse);
  });

  test('forceRevealAll reveals every word', () {
    final words = builder.buildWords(
      ayahs: ayahs,
      mistakes: const [],
      visibilityMode: Tasmee3TextVisibilityMode.hifzTest,
      forceRevealAll: true,
    );

    expect(words.every((word) => word.isRevealed), isTrue);
  });
}
