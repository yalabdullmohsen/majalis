import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_diagnostics_service.dart';
import 'package:mushafi/features/tasmee3/domain/asr_engine_mode.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_app_info.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_daily_goal.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_user_asr_settings.dart';

void main() {
  group('Tasmee3DiagnosticsService', () {
    test('redacts API key', () {
      const service = Tasmee3DiagnosticsService();

      final text = service.buildDiagnostics(
        appInfo: const Tasmee3AppInfo(
          appName: 'Test',
          packageName: 'com.test',
          version: '1.0.0',
          buildNumber: '1',
        ),
        sessions: const [],
        asrSettings: const Tasmee3UserAsrSettings(
          mode: AsrEngineMode.auto,
          endpoint: 'https://example.com/transcribe',
          apiKey: 'SECRET_KEY',
          allowServerAudioUpload: true,
          enableAutoRetry: true,
          maxRetryCount: 2,
          saveFailedSessionsQueue: true,
          liveWebSocketEndpoint: '',
          enableLiveWebSocket: false,
          enableNativePcmStreaming: false,
        ),
        dailyGoal: const Tasmee3DailyGoal.defaults(),
        quranReport: null,
      );

      expect(text.contains('SECRET_KEY'), false);
      expect(text.contains('[REDACTED]'), true);
      expect(text.contains('Audio is not included in diagnostics.'), true);
      expect(text.contains('Quran text is not included in diagnostics.'), true);
    });

    test('does not include Quran text or audio content', () {
      const service = Tasmee3DiagnosticsService();

      final text = service.buildDiagnostics(
        appInfo: const Tasmee3AppInfo(
          appName: 'Test',
          packageName: 'com.test',
          version: '1.0.0',
          buildNumber: '1',
        ),
        sessions: const [],
        asrSettings: const Tasmee3UserAsrSettings(
          mode: AsrEngineMode.auto,
          endpoint: '',
          apiKey: '',
          allowServerAudioUpload: false,
          enableAutoRetry: true,
          maxRetryCount: 2,
          saveFailedSessionsQueue: true,
          liveWebSocketEndpoint: '',
          enableLiveWebSocket: false,
          enableNativePcmStreaming: false,
        ),
        dailyGoal: const Tasmee3DailyGoal.defaults(),
        quranReport: null,
      );

      expect(text.contains('قل هو الله احد'), false);
      expect(text.toLowerCase().contains('audio bytes'), false);
    });
  });
}
