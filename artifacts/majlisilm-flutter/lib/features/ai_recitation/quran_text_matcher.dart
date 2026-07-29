import 'models/quran_word_state.dart';
import 'models/word_recitation_status.dart';

/// Arabic Quran text normalization + sequential fuzzy alignment engine.
class QuranTextMatcher {
  QuranTextMatcher({this.lookahead = 2});

  /// How many upcoming words may be scanned when the current one is missed.
  final int lookahead;

  /// Strips tashkeel / Quranic marks and standardizes letter variants.
  static String normalizeArabicText(String input) {
    if (input.isEmpty) return '';

    final buffer = StringBuffer();
    for (final rune in input.runes) {
      // Strip Arabic diacritics / tanween / superscript alef / Quranic annotation
      // marks in the ranges U+064B–U+0652, U+0670, U+06D6–U+06ED.
      if ((rune >= 0x064B && rune <= 0x0652) ||
          rune == 0x0670 ||
          (rune >= 0x06D6 && rune <= 0x06ED) ||
          rune == 0x0640) {
        // Also drop tatweel (ـ).
        continue;
      }

      var ch = String.fromCharCode(rune);

      // Alef variations → ا
      if (ch == 'أ' || ch == 'إ' || ch == 'آ' || ch == 'ٱ') {
        ch = 'ا';
      }
      // Taa marbuta → ه
      else if (ch == 'ة') {
        ch = 'ه';
      }
      // Alef maqsura → ي
      else if (ch == 'ى') {
        ch = 'ي';
      }
      // Drop non-Arabic letters/digits/punctuation except whitespace.
      else if (!_isArabicLetter(rune) && !_isWhitespace(rune)) {
        continue;
      }

      buffer.write(ch);
    }

    return buffer
        .toString()
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static bool _isArabicLetter(int rune) =>
      (rune >= 0x0621 && rune <= 0x063A) ||
      (rune >= 0x0641 && rune <= 0x064A) ||
      rune == 0x066E ||
      rune == 0x066F ||
      (rune >= 0x0671 && rune <= 0x06D3) ||
      rune == 0x06D5 ||
      (rune >= 0x06EE && rune <= 0x06FF);

  static bool _isWhitespace(int rune) =>
      rune == 0x20 || rune == 0x09 || rune == 0x0A || rune == 0x0D;

  /// Tokenizes an Uthmani verse into [QuranWordState] rows (all pending).
  List<QuranWordState> buildWordStates(String verseUthmani) {
    final rawTokens = verseUthmani
        .trim()
        .split(RegExp(r'\s+'))
        .where((t) => t.isNotEmpty)
        .toList(growable: false);

    final states = <QuranWordState>[];
    for (var i = 0; i < rawTokens.length; i++) {
      final original = rawTokens[i];
      final normalized = normalizeArabicText(original);
      if (normalized.isEmpty) continue;
      states.add(
        QuranWordState(
          originalWord: original,
          normalizedWord: normalized,
          status: WordRecitationStatus.pending,
          index: states.length,
        ),
      );
    }
    return states;
  }

  /// Sequential match of [spokenText] against [targetWords] with lookahead.
  ///
  /// Returns a new list (does not mutate [targetWords]) and the next expected
  /// cursor index after applying the spoken tokens.
  MatchSpokenResult matchSpokenText({
    required List<QuranWordState> targetWords,
    required String spokenText,
    int cursor = 0,
  }) {
    if (targetWords.isEmpty) {
      return const MatchSpokenResult(
        words: [],
        nextCursor: 0,
        newlyCorrect: 0,
        newlyIncorrect: 0,
        newlyMissing: 0,
        verseComplete: true,
      );
    }

    final spokenTokens = normalizeArabicText(spokenText)
        .split(RegExp(r'\s+'))
        .where((t) => t.isNotEmpty)
        .toList(growable: false);

    final updated = targetWords
        .map((w) => w.copyWith())
        .toList(growable: false);

    var i = cursor.clamp(0, updated.length);
    var newlyCorrect = 0;
    var newlyIncorrect = 0;
    var newlyMissing = 0;

    for (final spoken in spokenTokens) {
      if (i >= updated.length) break;

      final exact = _findMatchIndex(
        words: updated,
        from: i,
        spoken: spoken,
        window: 0,
      );

      if (exact != null) {
        if (exact > i) {
          for (var m = i; m < exact; m++) {
            if (updated[m].status == WordRecitationStatus.pending) {
              updated[m] = updated[m]
                  .copyWith(status: WordRecitationStatus.missing);
              newlyMissing++;
            }
          }
        }
        if (updated[exact].status != WordRecitationStatus.correct) {
          updated[exact] =
              updated[exact].copyWith(status: WordRecitationStatus.correct);
          newlyCorrect++;
        }
        i = exact + 1;
        continue;
      }

      final near = _findMatchIndex(
        words: updated,
        from: i,
        spoken: spoken,
        window: lookahead.clamp(1, 2),
      );

      if (near != null) {
        for (var m = i; m < near; m++) {
          if (updated[m].status == WordRecitationStatus.pending) {
            updated[m] =
                updated[m].copyWith(status: WordRecitationStatus.missing);
            newlyMissing++;
          }
        }
        updated[near] =
            updated[near].copyWith(status: WordRecitationStatus.correct);
        newlyCorrect++;
        i = near + 1;
        continue;
      }

      // No match inside lookahead — mark current expected word incorrect and
      // advance one slot so the session can recover on the next spoken word.
      if (updated[i].status == WordRecitationStatus.pending ||
          updated[i].status == WordRecitationStatus.incorrect) {
        if (updated[i].status != WordRecitationStatus.incorrect) {
          newlyIncorrect++;
        }
        updated[i] =
            updated[i].copyWith(status: WordRecitationStatus.incorrect);
      }
      i = (i + 1).clamp(0, updated.length);
    }

    final verseComplete = updated.every(
      (w) =>
          w.status == WordRecitationStatus.correct ||
          w.status == WordRecitationStatus.missing,
    );

    return MatchSpokenResult(
      words: updated,
      nextCursor: i.clamp(0, updated.length),
      newlyCorrect: newlyCorrect,
      newlyIncorrect: newlyIncorrect,
      newlyMissing: newlyMissing,
      verseComplete: verseComplete && updated.isNotEmpty,
    );
  }

  int? _findMatchIndex({
    required List<QuranWordState> words,
    required int from,
    required String spoken,
    required int window,
  }) {
    final end = (from + window).clamp(from, words.length - 1);
    for (var j = from; j <= end && j < words.length; j++) {
      if (_tokensEqual(words[j].normalizedWord, spoken)) {
        return j;
      }
    }
    return null;
  }

  /// Equality with light fuzzy tolerance (edit distance ≤ 1 for long tokens).
  static bool _tokensEqual(String expected, String spoken) {
    if (expected == spoken) return true;
    if (expected.isEmpty || spoken.isEmpty) return false;
    if ((expected.length - spoken.length).abs() > 1) return false;
    if (expected.length <= 2) return expected == spoken;
    return _levenshtein(expected, spoken) <= 1;
  }

  static int _levenshtein(String a, String b) {
    if (a == b) return 0;
    if (a.isEmpty) return b.length;
    if (b.isEmpty) return a.length;

    final prev = List<int>.generate(b.length + 1, (i) => i);
    final curr = List<int>.filled(b.length + 1, 0);

    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var j = 1; j <= b.length; j++) {
        final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
        curr[j] = [
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost,
        ].reduce((x, y) => x < y ? x : y);
      }
      for (var j = 0; j <= b.length; j++) {
        prev[j] = curr[j];
      }
    }
    return prev[b.length];
  }
}

class MatchSpokenResult {
  const MatchSpokenResult({
    required this.words,
    required this.nextCursor,
    required this.newlyCorrect,
    required this.newlyIncorrect,
    required this.newlyMissing,
    required this.verseComplete,
  });

  final List<QuranWordState> words;
  final int nextCursor;
  final int newlyCorrect;
  final int newlyIncorrect;
  final int newlyMissing;
  final bool verseComplete;

  double get accuracy {
    if (words.isEmpty) return 0;
    final correct =
        words.where((w) => w.status == WordRecitationStatus.correct).length;
    return correct / words.length;
  }
}
