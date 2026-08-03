import 'package:flutter/material.dart';

import '../../application/tasmee3_display_builder.dart';
import '../../domain/quran_ayah.dart';
import '../../domain/tasmee3_display_word.dart';
import '../../domain/tasmee3_live_progress.dart';
import '../../domain/tasmee3_live_word_status.dart';
import '../../domain/tasmee3_mistake.dart';
import '../../domain/tasmee3_text_visibility_mode.dart';

class Tasmee3MushafRecitationView extends StatelessWidget {
  final List<QuranAyah> ayahs;
  final List<Tasmee3Mistake> mistakes;
  final Tasmee3TextVisibilityMode visibilityMode;
  final bool forceRevealAll;
  final Tasmee3DisplayBuilder displayBuilder;
  final Tasmee3LiveProgress? liveProgress;
  final double fontSize;

  const Tasmee3MushafRecitationView({
    super.key,
    required this.ayahs,
    required this.mistakes,
    required this.visibilityMode,
    required this.forceRevealAll,
    required this.displayBuilder,
    this.liveProgress,
    this.fontSize = 25,
  });

  @override
  Widget build(BuildContext context) {
    final displayWords = displayBuilder.buildWords(
      ayahs: ayahs,
      mistakes: mistakes,
      visibilityMode: visibilityMode,
      forceRevealAll: forceRevealAll,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE0C5A3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: SingleChildScrollView(
          child: RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              children: _buildSpans(displayWords),
            ),
          ),
        ),
      ),
    );
  }

  List<InlineSpan> _buildSpans(List<Tasmee3DisplayWord> words) {
    final spans = <InlineSpan>[];

    for (int i = 0; i < words.length; i++) {
      final word = words[i];

      final displayText = word.isRevealed
          ? word.text
          : displayBuilder.displayTextForHiddenWord(word.text);

      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 3),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: _backgroundColor(word),
              borderRadius: BorderRadius.circular(8),
              border: _border(word),
            ),
            child: Text(
              displayText,
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontSize: fontSize,
                height: 1.8,
                color: _textColor(word),
                fontWeight:
                    word.hasMistake ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ),
        ),
      );

      spans.add(
        const TextSpan(
          text: ' ',
          style: TextStyle(fontSize: 8),
        ),
      );

      if (_shouldAddAyahMarker(words, i)) {
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: _AyahMiniMarker(number: word.ayahRef.ayah),
          ),
        );

        spans.add(
          const TextSpan(text: '  '),
        );
      }
    }

    return spans;
  }

  bool _shouldAddAyahMarker(List<Tasmee3DisplayWord> words, int index) {
    if (index == words.length - 1) {
      return true;
    }

    return words[index].ayahRef != words[index + 1].ayahRef;
  }

  Tasmee3LiveWordStatus? _liveStatusFor(Tasmee3DisplayWord word) {
    final live = liveProgress;

    if (live == null || live.words.isEmpty) {
      return null;
    }

    if (word.globalWordIndex < 0 ||
        word.globalWordIndex >= live.words.length) {
      return null;
    }

    return live.words[word.globalWordIndex].status;
  }

  Color _backgroundColor(Tasmee3DisplayWord word) {
    final mistake = word.mistake;

    // Final analysis mistakes take priority over live follow colors.
    if (mistake != null) {
      switch (mistake.type) {
        case Tasmee3MistakeType.missingWord:
          return Colors.orange.withValues(alpha: 0.14);
        case Tasmee3MistakeType.extraWord:
          return Colors.blue.withValues(alpha: 0.10);
        case Tasmee3MistakeType.wrongWord:
          return Colors.red.withValues(alpha: 0.12);
        case Tasmee3MistakeType.lowConfidence:
          return Colors.blueGrey.withValues(alpha: 0.12);
      }
    }

    final liveStatus = _liveStatusFor(word);

    if (liveStatus == Tasmee3LiveWordStatus.current) {
      return const Color(0xFFA77A48).withValues(alpha: 0.16);
    }

    if (liveStatus == Tasmee3LiveWordStatus.recognized) {
      return Colors.green.withValues(alpha: 0.10);
    }

    if (liveStatus == Tasmee3LiveWordStatus.possibleMistake) {
      return Colors.red.withValues(alpha: 0.08);
    }

    if (liveStatus == Tasmee3LiveWordStatus.skipped) {
      return Colors.orange.withValues(alpha: 0.12);
    }

    if (!word.isRevealed) {
      return const Color(0xFFF9F1E6);
    }

    // قبل التحليل: نص هادئ. بعد التحليل: أخضر خفيف للصحيح.
    if (mistakes.isEmpty) {
      return Colors.transparent;
    }

    return Colors.green.withValues(alpha: 0.08);
  }

  Border? _border(Tasmee3DisplayWord word) {
    final mistake = word.mistake;

    if (mistake != null) {
      Color color;

      switch (mistake.type) {
        case Tasmee3MistakeType.missingWord:
          color = Colors.orange;
          break;
        case Tasmee3MistakeType.extraWord:
          color = Colors.blue;
          break;
        case Tasmee3MistakeType.wrongWord:
          color = Colors.red;
          break;
        case Tasmee3MistakeType.lowConfidence:
          color = Colors.blueGrey;
          break;
      }

      return Border.all(color: color.withValues(alpha: 0.35));
    }

    final liveStatus = _liveStatusFor(word);

    if (liveStatus == Tasmee3LiveWordStatus.current) {
      return Border.all(color: const Color(0xFFA77A48), width: 1.2);
    }

    if (!word.isRevealed || mistakes.isEmpty) {
      return null;
    }

    return Border.all(color: Colors.green.withValues(alpha: 0.25));
  }

  Color _textColor(Tasmee3DisplayWord word) {
    final mistake = word.mistake;

    if (mistake != null) {
      switch (mistake.type) {
        case Tasmee3MistakeType.missingWord:
          return Colors.orange.shade900;
        case Tasmee3MistakeType.extraWord:
          return Colors.blue.shade900;
        case Tasmee3MistakeType.wrongWord:
          return Colors.red.shade900;
        case Tasmee3MistakeType.lowConfidence:
          return Colors.blueGrey.shade900;
      }
    }

    final liveStatus = _liveStatusFor(word);

    if (liveStatus == Tasmee3LiveWordStatus.current) {
      return const Color(0xFFA77A48);
    }

    if (liveStatus == Tasmee3LiveWordStatus.recognized) {
      return Colors.green.shade900;
    }

    if (liveStatus == Tasmee3LiveWordStatus.possibleMistake) {
      return Colors.red.shade900;
    }

    if (!word.isRevealed) {
      return const Color(0xFFB8A58F);
    }

    if (mistakes.isEmpty) {
      return const Color(0xFF11100E);
    }

    return Colors.green.shade900;
  }
}

class _AyahMiniMarker extends StatelessWidget {
  final int number;

  const _AyahMiniMarker({
    required this.number,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFA77A48)),
        color: const Color(0xFFFBF7EF),
      ),
      child: Text(
        '$number',
        style: const TextStyle(
          color: Color(0xFFA77A48),
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
