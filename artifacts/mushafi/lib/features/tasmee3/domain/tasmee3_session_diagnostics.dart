class Tasmee3SessionDiagnostics {
  final int durationSeconds;
  final int expectedWordsCount;
  final int recognizedWordsCount;
  final int mistakesCount;
  final int lowConfidenceCount;
  final double accuracy;
  final double? averageAudioLevel;
  final double? maxAudioLevel;
  final bool usedAdvancedAsr;
  final bool usedFallback;
  final List<String> notes;

  const Tasmee3SessionDiagnostics({
    required this.durationSeconds,
    required this.expectedWordsCount,
    required this.recognizedWordsCount,
    required this.mistakesCount,
    required this.lowConfidenceCount,
    required this.accuracy,
    this.averageAudioLevel,
    this.maxAudioLevel,
    required this.usedAdvancedAsr,
    required this.usedFallback,
    required this.notes,
  });

  int get accuracyPercent => (accuracy * 100).round();

  Map<String, dynamic> toJson() {
    return {
      'durationSeconds': durationSeconds,
      'expectedWordsCount': expectedWordsCount,
      'recognizedWordsCount': recognizedWordsCount,
      'mistakesCount': mistakesCount,
      'lowConfidenceCount': lowConfidenceCount,
      'accuracy': accuracy,
      'averageAudioLevel': averageAudioLevel,
      'maxAudioLevel': maxAudioLevel,
      'usedAdvancedAsr': usedAdvancedAsr,
      'usedFallback': usedFallback,
      'notes': notes,
    };
  }
}
