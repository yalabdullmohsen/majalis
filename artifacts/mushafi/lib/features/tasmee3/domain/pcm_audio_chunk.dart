import 'dart:typed_data';

class PcmAudioChunk {
  final Uint8List bytes;
  final int sequence;
  final DateTime timestamp;

  const PcmAudioChunk({
    required this.bytes,
    required this.sequence,
    required this.timestamp,
  });
}
