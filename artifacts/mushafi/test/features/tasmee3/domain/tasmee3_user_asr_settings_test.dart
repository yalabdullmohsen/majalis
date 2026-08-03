import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_user_asr_settings.dart';

void main() {
  group('Tasmee3UserAsrSettings.defaults', () {
    test('server upload is disabled by default', () {
      const settings = Tasmee3UserAsrSettings.defaults();

      expect(settings.allowServerAudioUpload, false);
      expect(settings.endpoint, '');
      expect(settings.liveWebSocketEndpoint, '');
      expect(settings.enableLiveWebSocket, false);
      expect(settings.enableNativePcmStreaming, false);
      expect(settings.canUseAdvancedServer, false);
      expect(settings.canUseLiveWebSocket, false);
      expect(settings.canUseNativePcmStreaming, false);
    });
  });
}
