import 'package:flutter/material.dart';

import '../../../tasmee3/application/arabic_normalizer.dart';
import '../../../tasmee3/presentation/tasmee3_design_tokens.dart';

class SearchHighlightedAyahText extends StatelessWidget {
  final String text;
  final String query;
  final TextStyle? style;

  const SearchHighlightedAyahText({
    super.key,
    required this.text,
    required this.query,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    final baseStyle = style ??
        Tasmee3TextStyles.arabicAyah.copyWith(
          fontSize: 22,
        );

    final queryTokens = ArabicNormalizer.tokenize(query).toSet();

    if (queryTokens.isEmpty) {
      return Text(
        text,
        textAlign: TextAlign.right,
        style: baseStyle,
      );
    }

    final words =
        text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: RichText(
        textAlign: TextAlign.right,
        text: TextSpan(
          children: [
            for (final word in words) ...[
              TextSpan(
                text: word,
                style: _isHit(word, queryTokens)
                    ? baseStyle.copyWith(
                        backgroundColor:
                            Tasmee3Colors.primary.withValues(alpha: 0.18),
                        color: Tasmee3Colors.primaryDark,
                        fontWeight: FontWeight.bold,
                      )
                    : baseStyle,
              ),
              const TextSpan(text: ' '),
            ],
          ],
        ),
      ),
    );
  }

  bool _isHit(String word, Set<String> queryTokens) {
    final normalized = ArabicNormalizer.normalize(word);

    if (queryTokens.contains(normalized)) {
      return true;
    }

    for (final token in queryTokens) {
      if (token.length >= 3 && normalized.contains(token)) {
        return true;
      }
    }

    return false;
  }
}
