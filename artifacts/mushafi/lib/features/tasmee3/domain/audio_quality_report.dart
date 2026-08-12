enum AudioQualityLevel {
  excellent,
  good,
  fair,
  poor,
}

class AudioQualityReport {
  final AudioQualityLevel level;
  final double averageAmplitude;
  final double maxAmplitude;
  final int durationSeconds;
  final bool hasLongSilence;
  final bool isTooShort;
  final bool isTooQuiet;
  final List<String> warnings;

  const AudioQualityReport({
    required this.level,
    required this.averageAmplitude,
    required this.maxAmplitude,
    required this.durationSeconds,
    required this.hasLongSilence,
    required this.isTooShort,
    required this.isTooQuiet,
    required this.warnings,
  });

  bool get canSubmit {
    return !isTooShort && !isTooQuiet;
  }

  String get title {
    switch (level) {
      case AudioQualityLevel.excellent:
        return 'جودة الصوت ممتازة';
      case AudioQualityLevel.good:
        return 'جودة الصوت جيدة';
      case AudioQualityLevel.fair:
        return 'جودة الصوت متوسطة';
      case AudioQualityLevel.poor:
        return 'جودة الصوت ضعيفة';
    }
  }
}
