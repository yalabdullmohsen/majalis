class Tasmee3AppInfo {
  final String appName;
  final String packageName;
  final String version;
  final String buildNumber;

  const Tasmee3AppInfo({
    required this.appName,
    required this.packageName,
    required this.version,
    required this.buildNumber,
  });

  String get versionLabel => '$version+$buildNumber';
}
