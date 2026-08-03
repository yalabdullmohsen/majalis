enum Tasmee3VoiceCommandType {
  repeat,
  next,
  reveal,
  hide,
  stop,
  unknown,
}

class Tasmee3VoiceCommand {
  final Tasmee3VoiceCommandType type;
  final String rawText;
  final DateTime detectedAt;

  const Tasmee3VoiceCommand({
    required this.type,
    required this.rawText,
    required this.detectedAt,
  });

  bool get isKnown => type != Tasmee3VoiceCommandType.unknown;
}
