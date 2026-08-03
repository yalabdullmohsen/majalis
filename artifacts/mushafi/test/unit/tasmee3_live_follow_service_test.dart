import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_live_follow_service.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_live_progress.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_live_word_status.dart';

void main() {
  const service = Tasmee3LiveFollowService();

  final ayahs = [
    const QuranAyah(
      ref: AyahRef(surah: 112, ayah: 1),
      textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    ),
  ];

  test('initialize marks first word as current', () {
    final progress = service.initialize(ayahs);

    expect(progress.hasWords, isTrue);
    expect(progress.words.first.status, Tasmee3LiveWordStatus.current);
    expect(progress.currentAyah?.ayah, 1);
  });

  test('updateWithRecognizedText advances live matching', () {
    final initial = service.initialize(ayahs);

    final updated = service.updateWithRecognizedText(
      current: initial,
      recognizedText: 'قل هو',
      confidence: 0.9,
    );

    expect(updated.recognizedCount, greaterThanOrEqualTo(1));
    expect(
      updated.words.take(updated.recognizedCount).every(
            (word) =>
                word.status == Tasmee3LiveWordStatus.recognized ||
                word.status == Tasmee3LiveWordStatus.possibleMistake,
          ),
      isTrue,
    );
  });

  test('empty recognition after delay marks possible silence', () {
    final seeded = service.updateWithRecognizedText(
      current: service.initialize(ayahs),
      recognizedText: 'قل',
      confidence: 0.8,
    );

    final aged = Tasmee3LiveProgress(
      words: seeded.words,
      currentWordIndex: seeded.currentWordIndex,
      recognizedCount: seeded.recognizedCount,
      totalWords: seeded.totalWords,
      currentAyah: seeded.currentAyah,
      isUserPossiblySilent: false,
      lastUpdatedAt: DateTime.now().subtract(const Duration(seconds: 6)),
      ayahProgress: seeded.ayahProgress,
    );

    final silent = service.updateWithRecognizedText(
      current: aged,
      recognizedText: '',
      confidence: 0,
    );

    expect(silent.isUserPossiblySilent, isTrue);
  });
}
