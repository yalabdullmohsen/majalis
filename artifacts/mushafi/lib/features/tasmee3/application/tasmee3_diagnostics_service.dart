import '../domain/quran_integrity_report.dart';
import '../domain/tasmee3_app_info.dart';
import '../domain/tasmee3_daily_goal.dart';
import '../domain/tasmee3_session_record.dart';
import '../domain/tasmee3_user_asr_settings.dart';

class Tasmee3DiagnosticsService {
  const Tasmee3DiagnosticsService();

  String buildDiagnostics({
    required Tasmee3AppInfo appInfo,
    required List<Tasmee3SessionRecord> sessions,
    required Tasmee3UserAsrSettings asrSettings,
    required Tasmee3DailyGoal dailyGoal,
    required QuranIntegrityReport? quranReport,
  }) {
    final buffer = StringBuffer();

    buffer.writeln('Tasmee3 Diagnostics');
    buffer.writeln('===================');
    buffer.writeln('Generated At: ${DateTime.now().toIso8601String()}');
    buffer.writeln('');
    buffer.writeln('App');
    buffer.writeln('---');
    buffer.writeln('Name: ${appInfo.appName}');
    buffer.writeln('Package: ${appInfo.packageName}');
    buffer.writeln('Version: ${appInfo.version}');
    buffer.writeln('Build: ${appInfo.buildNumber}');
    buffer.writeln('');
    buffer.writeln('Sessions');
    buffer.writeln('--------');
    buffer.writeln('Total Sessions: ${sessions.length}');

    if (sessions.isNotEmpty) {
      final avgAccuracy = sessions
              .map((session) => session.accuracyPercent)
              .reduce((a, b) => a + b) /
          sessions.length;

      final totalDuration = sessions.fold<int>(
        0,
        (sum, session) => sum + session.durationSeconds,
      );

      final latest = sessions.reduce(
        (a, b) => a.createdAt.isAfter(b.createdAt) ? a : b,
      );

      buffer.writeln('Average Accuracy Percent: ${avgAccuracy.round()}');
      buffer.writeln('Total Duration Seconds: $totalDuration');
      buffer.writeln('Last Session: ${latest.createdAt.toIso8601String()}');
    }

    buffer.writeln('');
    buffer.writeln('ASR Settings');
    buffer.writeln('------------');
    buffer.writeln('Mode: ${asrSettings.mode.name}');
    buffer.writeln(
      'Has HTTP Endpoint: ${asrSettings.endpoint.trim().isNotEmpty}',
    );
    buffer.writeln(
      'Has WebSocket Endpoint: ${asrSettings.liveWebSocketEndpoint.trim().isNotEmpty}',
    );
    buffer.writeln('Allow Server Upload: ${asrSettings.allowServerAudioUpload}');
    buffer.writeln('Live WebSocket Enabled: ${asrSettings.enableLiveWebSocket}');
    buffer.writeln(
      'Native PCM Enabled: ${asrSettings.enableNativePcmStreaming}',
    );
    buffer.writeln('Auto Retry Enabled: ${asrSettings.enableAutoRetry}');
    buffer.writeln('Max Retry Count: ${asrSettings.maxRetryCount}');
    buffer.writeln('API Key Present: ${asrSettings.apiKey.trim().isNotEmpty}');
    buffer.writeln('API Key Value: [REDACTED]');
    buffer.writeln('');
    buffer.writeln('Daily Goal');
    buffer.writeln('----------');
    buffer.writeln('Enabled: ${dailyGoal.enabled}');
    buffer.writeln('Type: ${dailyGoal.type.name}');
    buffer.writeln('Target Value: ${dailyGoal.targetValue}');
    buffer.writeln('Reminder Enabled: ${dailyGoal.reminderEnabled}');
    buffer.writeln('Reminder Time: ${dailyGoal.reminderTime}');
    buffer.writeln('');
    buffer.writeln('Quran Integrity');
    buffer.writeln('---------------');

    if (quranReport == null) {
      buffer.writeln('Status: Not checked');
    } else {
      buffer.writeln('Valid: ${quranReport.isValid}');
      buffer.writeln('Surahs: ${quranReport.totalSurahs}');
      buffer.writeln('Ayahs: ${quranReport.totalAyahs}');
      buffer.writeln('Empty Ayahs: ${quranReport.emptyAyahsCount}');
      buffer.writeln('Duplicates: ${quranReport.duplicateAyahsCount}');
      buffer.writeln('Issues: ${quranReport.issuesCount}');
    }

    buffer.writeln('');
    buffer.writeln('Privacy');
    buffer.writeln('-------');
    buffer.writeln('Audio is not included in diagnostics.');
    buffer.writeln('Quran text is not included in diagnostics.');
    buffer.writeln('API keys are redacted.');
    buffer.writeln('Diagnostics are generated locally.');

    return buffer.toString();
  }
}
