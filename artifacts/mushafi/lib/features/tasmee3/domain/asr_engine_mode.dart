enum AsrEngineMode {
  auto,
  advancedServer,
  deviceFallback,
}

extension AsrEngineModeLabel on AsrEngineMode {
  String get arabicLabel {
    switch (this) {
      case AsrEngineMode.auto:
        return 'تلقائي';
      case AsrEngineMode.advancedServer:
        return 'الخادم المتقدم';
      case AsrEngineMode.deviceFallback:
        return 'تعرف الجهاز';
    }
  }
}
