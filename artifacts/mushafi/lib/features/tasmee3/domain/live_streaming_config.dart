class LiveStreamingConfig {
  final Duration chunkDuration;
  final Duration partialTimeout;
  final int sampleRate;
  final int bitRate;
  final int channels;

  const LiveStreamingConfig({
    this.chunkDuration = const Duration(seconds: 3),
    this.partialTimeout = const Duration(seconds: 8),
    this.sampleRate = 16000,
    this.bitRate = 128000,
    this.channels = 1,
  });
}
