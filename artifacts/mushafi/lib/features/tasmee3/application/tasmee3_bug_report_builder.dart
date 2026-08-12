import '../domain/tasmee3_app_info.dart';
import '../domain/tasmee3_bug_report_category.dart';

class Tasmee3BugReportBuilder {
  const Tasmee3BugReportBuilder();

  String build({
    required Tasmee3AppInfo appInfo,
    required Tasmee3BugReportCategory category,
    required String userDescription,
    required String diagnostics,
  }) {
    final buffer = StringBuffer();

    buffer.writeln('Tasmee3 Bug Report');
    buffer.writeln('==================');
    buffer.writeln('Generated At: ${DateTime.now().toIso8601String()}');
    buffer.writeln('');
    buffer.writeln('Category: ${category.name}');
    buffer.writeln('Category Label: ${category.arabicLabel}');
    buffer.writeln('');
    buffer.writeln('App Version');
    buffer.writeln('-----------');
    buffer.writeln('App: ${appInfo.appName}');
    buffer.writeln('Package: ${appInfo.packageName}');
    buffer.writeln('Version: ${appInfo.version}');
    buffer.writeln('Build: ${appInfo.buildNumber}');
    buffer.writeln('');
    buffer.writeln('User Description');
    buffer.writeln('----------------');
    buffer.writeln(
      userDescription.trim().isEmpty
          ? '[No description provided]'
          : userDescription.trim(),
    );
    buffer.writeln('');
    buffer.writeln('Diagnostics');
    buffer.writeln('-----------');
    buffer.writeln(diagnostics);
    buffer.writeln('');
    buffer.writeln('Privacy Notice');
    buffer.writeln('--------------');
    buffer.writeln(
      'This report should not include audio, API keys, or Quran text.',
    );
    buffer.writeln('Reports are copied locally and are not sent automatically.');

    return buffer.toString();
  }
}
