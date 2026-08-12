enum AsrConnectionStatusType {
  unknown,
  connected,
  disconnected,
  missingEndpoint,
  unauthorized,
  error,
}

class AsrConnectionStatus {
  final AsrConnectionStatusType type;
  final String message;
  final DateTime checkedAt;

  const AsrConnectionStatus({
    required this.type,
    required this.message,
    required this.checkedAt,
  });

  bool get isConnected => type == AsrConnectionStatusType.connected;

  factory AsrConnectionStatus.unknown() {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.unknown,
      message: 'لم يتم اختبار الاتصال بعد.',
      checkedAt: DateTime.now(),
    );
  }

  factory AsrConnectionStatus.missingEndpoint() {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.missingEndpoint,
      message: 'عنوان الخادم غير مضبوط.',
      checkedAt: DateTime.now(),
    );
  }

  factory AsrConnectionStatus.connected() {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.connected,
      message: 'الخادم متصل وجاهز.',
      checkedAt: DateTime.now(),
    );
  }

  factory AsrConnectionStatus.disconnected() {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.disconnected,
      message: 'تعذر الاتصال بالخادم.',
      checkedAt: DateTime.now(),
    );
  }

  factory AsrConnectionStatus.unauthorized() {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.unauthorized,
      message: 'مفتاح الوصول غير صحيح أو مفقود.',
      checkedAt: DateTime.now(),
    );
  }

  factory AsrConnectionStatus.error(String message) {
    return AsrConnectionStatus(
      type: AsrConnectionStatusType.error,
      message: message,
      checkedAt: DateTime.now(),
    );
  }
}
