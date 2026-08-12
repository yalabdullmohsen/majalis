import 'package:flutter/material.dart';

class Tasmee3UiSettings {
  final Color backgroundColor;
  final Color surfaceColor;
  final Color primaryColor;
  final Color textColor;
  final Color secondaryTextColor;
  final double arabicFontSize;
  final double resultWordFontSize;
  final bool showRecognizedTextWhileListening;
  final bool showAccuracyCard;
  final bool enableHapticFeedback;

  const Tasmee3UiSettings({
    this.backgroundColor = const Color(0xFFFBF7EF),
    this.surfaceColor = const Color(0xFFFFFCF7),
    this.primaryColor = const Color(0xFFA77A48),
    this.textColor = const Color(0xFF11100E),
    this.secondaryTextColor = const Color(0xFF9A8068),
    this.arabicFontSize = 24,
    this.resultWordFontSize = 22,
    this.showRecognizedTextWhileListening = true,
    this.showAccuracyCard = true,
    this.enableHapticFeedback = true,
  });

  Tasmee3UiSettings copyWith({
    Color? backgroundColor,
    Color? surfaceColor,
    Color? primaryColor,
    Color? textColor,
    Color? secondaryTextColor,
    double? arabicFontSize,
    double? resultWordFontSize,
    bool? showRecognizedTextWhileListening,
    bool? showAccuracyCard,
    bool? enableHapticFeedback,
  }) {
    return Tasmee3UiSettings(
      backgroundColor: backgroundColor ?? this.backgroundColor,
      surfaceColor: surfaceColor ?? this.surfaceColor,
      primaryColor: primaryColor ?? this.primaryColor,
      textColor: textColor ?? this.textColor,
      secondaryTextColor: secondaryTextColor ?? this.secondaryTextColor,
      arabicFontSize: arabicFontSize ?? this.arabicFontSize,
      resultWordFontSize: resultWordFontSize ?? this.resultWordFontSize,
      showRecognizedTextWhileListening: showRecognizedTextWhileListening ??
          this.showRecognizedTextWhileListening,
      showAccuracyCard: showAccuracyCard ?? this.showAccuracyCard,
      enableHapticFeedback: enableHapticFeedback ?? this.enableHapticFeedback,
    );
  }
}
