import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/data/asr_server_health_service.dart';
import 'package:mushafi/features/tasmee3/domain/live_asr_message.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_user_asr_settings.dart';

void main() {
  test('canUseLiveWebSocket requires flag, upload permission, and endpoint', () {
    const disabled = Tasmee3UserAsrSettings.defaults();
    expect(disabled.canUseLiveWebSocket, isFalse);

    final enabled = disabled.copyWith(
      enableLiveWebSocket: true,
      allowServerAudioUpload: true,
      liveWebSocketEndpoint: 'ws://127.0.0.1:8000/ws/live',
    );

    expect(enabled.canUseLiveWebSocket, isTrue);
  });

  test('LiveAsrMessage parses partial payload', () {
    final message = LiveAsrMessage.fromJson({
      'type': 'partial',
      'text': 'قل',
      'confidence': 0.8,
      'sequence': 3,
      'words': [
        {'word': 'قل', 'confidence': 0.8},
      ],
    });

    expect(message.type, LiveAsrMessageType.partial);
    expect(message.text, 'قل');
    expect(message.sequence, 3);
    expect(message.words.single.word, 'قل');
  });

  test('LiveAsrMessage defaults sequence to zero', () {
    final message = LiveAsrMessage.fromJson({
      'type': 'final',
      'text': 'هو',
      'confidence': 0.9,
      'words': [],
    });

    expect(message.type, LiveAsrMessageType.finalResult);
    expect(message.sequence, 0);
  });

  test('looksLikeWebSocketEndpoint detects ws schemes', () {
    final service = AsrServerHealthService();
    expect(service.looksLikeWebSocketEndpoint('ws://host/ws/live'), isTrue);
    expect(service.looksLikeWebSocketEndpoint('wss://host/ws/live'), isTrue);
    expect(
      service.looksLikeWebSocketEndpoint('http://host/transcribe'),
      isFalse,
    );
  });
}
