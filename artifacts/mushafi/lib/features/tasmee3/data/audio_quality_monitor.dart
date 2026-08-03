import 'dart:async';

import '../domain/audio_quality_report.dart';
import '../domain/live_audio_level.dart';

class AudioQualityMonitor {
  final List<double> _samples = [];
  DateTime? _startedAt;

  final StreamController<LiveAudioLevel> _levelController =
      StreamController<LiveAudioLevel>.broadcast();

  Stream<LiveAudioLevel> get levels => _levelController.stream;

  void start() {
    _samples.clear();
    _startedAt = DateTime.now();
  }

  void addAmplitude(double value) {
    final normalized = value.clamp(0, 1).toDouble();
    _samples.add(normalized);

    final average = _samples.isEmpty
        ? 0.0
        : _samples.reduce((a, b) => a + b) / _samples.length;

    final max =
        _samples.isEmpty ? 0.0 : _samples.reduce((a, b) => a > b ? a : b);

    if (!_levelController.isClosed) {
      _levelController.add(
        LiveAudioLevel(
          current: normalized,
          average: average,
          max: max,
          timestamp: DateTime.now(),
        ),
      );
    }
  }

  AudioQualityReport buildReport() {
    final started = _startedAt;
    final durationSeconds = started == null
        ? 0
        : DateTime.now().difference(started).inSeconds;

    final average = _samples.isEmpty
        ? 0.0
        : _samples.reduce((a, b) => a + b) / _samples.length;

    final max =
        _samples.isEmpty ? 0.0 : _samples.reduce((a, b) => a > b ? a : b);

    final silentSamples = _samples.where((sample) => sample < 0.04).length;
    final silenceRatio =
        _samples.isEmpty ? 1.0 : silentSamples / _samples.length;

    final isTooShort = durationSeconds < 2;
    final isTooQuiet = average < 0.05 || max < 0.12;
    final hasLongSilence = silenceRatio > 0.65 && durationSeconds >= 4;

    final warnings = <String>[];

    if (isTooShort) {
      warnings.add('مدة التسجيل قصيرة جدا. حاول قراءة آية كاملة على الأقل.');
    }

    if (isTooQuiet) {
      warnings.add(
        'الصوت منخفض. اقترب من الميكروفون أو ارفع صوتك قليلا.',
      );
    }

    if (hasLongSilence) {
      warnings.add(
        'يوجد صمت طويل أثناء التسجيل. اقرأ النطاق المختار بوضوح.',
      );
    }

    final AudioQualityLevel level;

    if (isTooShort || isTooQuiet) {
      level = AudioQualityLevel.poor;
    } else if (hasLongSilence) {
      level = AudioQualityLevel.fair;
    } else if (average >= 0.12 && max >= 0.35) {
      level = AudioQualityLevel.excellent;
    } else {
      level = AudioQualityLevel.good;
    }

    return AudioQualityReport(
      level: level,
      averageAmplitude: average,
      maxAmplitude: max,
      durationSeconds: durationSeconds,
      hasLongSilence: hasLongSilence,
      isTooShort: isTooShort,
      isTooQuiet: isTooQuiet,
      warnings: warnings,
    );
  }

  void dispose() {
    _levelController.close();
  }
}
