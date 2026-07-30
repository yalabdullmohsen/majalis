import 'package:flutter_test/flutter_test.dart';
import 'package:majlisilm_flutter/features/ai_recitation/models/word_recitation_status.dart';
import 'package:majlisilm_flutter/features/ai_recitation/quran_text_matcher.dart';

void main() {
  group('normalizeArabicText', () {
    test('strips tashkeel and tanween', () {
      expect(
        QuranTextMatcher.normalizeArabicText('بِسْمِ'),
        'بسم',
      );
    });

    test('standardizes alef / taa marbuta / alef maqsura', () {
      expect(QuranTextMatcher.normalizeArabicText('أحمد'), 'احمد');
      expect(QuranTextMatcher.normalizeArabicText('رحمة'), 'رحمه');
      expect(QuranTextMatcher.normalizeArabicText('على'), 'علي');
      expect(QuranTextMatcher.normalizeArabicText('ٱلْحَمْدُ'), 'الحمد');
    });
  });

  group('matchSpokenText', () {
    final matcher = QuranTextMatcher(lookahead: 2);
    const target =
        'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

    test('marks sequential correct words', () {
      final words = matcher.buildWordStates(target);
      final result = matcher.matchSpokenText(
        targetWords: words,
        spokenText: 'بسم الله',
      );
      expect(result.words[0].status, WordRecitationStatus.correct);
      expect(result.words[1].status, WordRecitationStatus.correct);
      expect(result.words[2].status, WordRecitationStatus.pending);
      expect(result.newlyCorrect, 2);
    });

    test('lookahead skips a missed word as missing then continues', () {
      final words = matcher.buildWordStates(target);
      final result = matcher.matchSpokenText(
        targetWords: words,
        spokenText: 'بسم الرحمن',
      );
      expect(result.words[0].status, WordRecitationStatus.correct);
      expect(result.words[1].status, WordRecitationStatus.missing);
      expect(result.words[2].status, WordRecitationStatus.correct);
    });

    test('incorrect when spoken token mismatches window', () {
      final words = matcher.buildWordStates(target);
      final result = matcher.matchSpokenText(
        targetWords: words,
        spokenText: 'كتاب',
      );
      expect(result.words[0].status, WordRecitationStatus.incorrect);
      expect(result.newlyIncorrect, greaterThan(0));
    });

    test('verseComplete when all matched', () {
      final words = matcher.buildWordStates(target);
      final result = matcher.matchSpokenText(
        targetWords: words,
        spokenText: 'بسم الله الرحمن الرحيم',
      );
      expect(result.verseComplete, isTrue);
      expect(
        result.words.every((w) => w.status == WordRecitationStatus.correct),
        isTrue,
      );
    });
  });
}
