import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_voice_command_detector.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_voice_command.dart';

void main() {
  const detector = Tasmee3VoiceCommandDetector();

  test('detects stop command', () {
    final command = detector.detect('توقف الآن');
    expect(command.type, Tasmee3VoiceCommandType.stop);
    expect(command.isKnown, isTrue);
  });

  test('detects reveal and hide commands', () {
    expect(
      detector.detect('أظهر النص').type,
      Tasmee3VoiceCommandType.reveal,
    );
    expect(
      detector.detect('أخف النص').type,
      Tasmee3VoiceCommandType.hide,
    );
  });

  test('returns unknown for Quran-like text without commands', () {
    final command = detector.detect('قل هو الله احد');
    expect(command.type, Tasmee3VoiceCommandType.unknown);
  });
}
