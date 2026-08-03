import '../domain/tasmee3_voice_command.dart';
import 'arabic_normalizer.dart';

class Tasmee3VoiceCommandDetector {
  const Tasmee3VoiceCommandDetector();

  Tasmee3VoiceCommand detect(String recognizedText) {
    final text = ArabicNormalizer.normalize(recognizedText);

    if (text.isEmpty) {
      return Tasmee3VoiceCommand(
        type: Tasmee3VoiceCommandType.unknown,
        rawText: recognizedText,
        detectedAt: DateTime.now(),
      );
    }

    final words = text.split(' ');

    Tasmee3VoiceCommandType type = Tasmee3VoiceCommandType.unknown;

    if (_containsAny(words, const ['اعد', 'اعاده', 'كرر', 'رجع'])) {
      type = Tasmee3VoiceCommandType.repeat;
    } else if (_containsAny(words, const ['التالي', 'بعد', 'اكمل'])) {
      type = Tasmee3VoiceCommandType.next;
    } else if (_containsAny(words, const ['اظهر', 'بين', 'اكشف'])) {
      type = Tasmee3VoiceCommandType.reveal;
    } else if (_containsAny(words, const ['اخف', 'اخفي', 'غطي'])) {
      type = Tasmee3VoiceCommandType.hide;
    } else if (_containsAny(words, const ['توقف', 'وقف', 'انهي'])) {
      type = Tasmee3VoiceCommandType.stop;
    }

    return Tasmee3VoiceCommand(
      type: type,
      rawText: recognizedText,
      detectedAt: DateTime.now(),
    );
  }

  bool _containsAny(List<String> words, List<String> candidates) {
    for (final candidate in candidates) {
      if (words.contains(candidate)) {
        return true;
      }
    }

    return false;
  }
}
