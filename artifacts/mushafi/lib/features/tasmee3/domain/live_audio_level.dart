class LiveAudioLevel {
  final double current;
  final double average;
  final double max;
  final DateTime timestamp;

  const LiveAudioLevel({
    required this.current,
    required this.average,
    required this.max,
    required this.timestamp,
  });
}
