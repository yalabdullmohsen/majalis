import 'package:package_info_plus/package_info_plus.dart';

import '../domain/tasmee3_app_info.dart';

class Tasmee3AppInfoService {
  const Tasmee3AppInfoService();

  Future<Tasmee3AppInfo> load() async {
    final info = await PackageInfo.fromPlatform();

    return Tasmee3AppInfo(
      appName: info.appName,
      packageName: info.packageName,
      version: info.version,
      buildNumber: info.buildNumber,
    );
  }
}
