class PcmAudioConfig {
  final int sampleRate;
  final int channels;
  final int bitsPerSample;
  final int chunkSizeBytes;

  const PcmAudioConfig({
    this.sampleRate = 16000,
    this.channels = 1,
    this.bitsPerSample = 16,
    this.chunkSizeBytes = 3200,
  });

  Map<String, dynamic> toJson() {
    return {
      'sampleRate': sampleRate,
      'channels': channels,
      'bitsPerSample': bitsPerSample,
      'chunkSizeBytes': chunkSizeBytes,
    };
  }
}
