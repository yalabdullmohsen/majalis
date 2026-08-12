import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/application/tasmee3_bug_report_builder.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_app_info.dart';
import 'package:mushafi/features/tasmee3/domain/tasmee3_bug_report_category.dart';

void main() {
  group('Tasmee3BugReportBuilder', () {
    test('builds bug report without modifying diagnostics', () {
      const builder = Tasmee3BugReportBuilder();

      final report = builder.build(
        appInfo: const Tasmee3AppInfo(
          appName: 'Test',
          packageName: 'com.test',
          version: '1.0.0',
          buildNumber: '1',
        ),
        category: Tasmee3BugReportCategory.microphone,
        userDescription: 'Mic did not work',
        diagnostics: 'API Key Value: [REDACTED]',
      );

      expect(report.contains('microphone'), true);
      expect(report.contains('Mic did not work'), true);
      expect(report.contains('[REDACTED]'), true);
      expect(report.contains('are not sent automatically'), true);
    });

    test('does not inject Quran text or audio content', () {
      const builder = Tasmee3BugReportBuilder();

      final report = builder.build(
        appInfo: const Tasmee3AppInfo(
          appName: 'Test',
          packageName: 'com.test',
          version: '1.0.0',
          buildNumber: '1',
        ),
        category: Tasmee3BugReportCategory.quranFile,
        userDescription: 'Integrity check failed',
        diagnostics: 'Audio is not included in diagnostics.\n'
            'Quran text is not included in diagnostics.\n'
            'API Key Value: [REDACTED]',
      );

      expect(report.contains('قل هو الله احد'), false);
      expect(report.toLowerCase().contains('audio bytes'), false);
      expect(report.contains('SECRET'), false);
    });
  });
}
