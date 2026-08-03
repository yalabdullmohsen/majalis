import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_runtime_config.dart';

void main() {
  group('Tasmee3RuntimeConfig', () {
    test('defaults are safe for release candidate', () {
      const config = Tasmee3RuntimeConfig();

      expect(config.defaultHttpAsrEndpoint, '');
      expect(config.defaultWebSocketEndpoint, '');
      expect(config.enableExperimentalPcm, false);
      expect(config.enableDebugDiagnostics, false);
      expect(config.allowExternalAudioUploadByDefault, false);
    });
  });
}
