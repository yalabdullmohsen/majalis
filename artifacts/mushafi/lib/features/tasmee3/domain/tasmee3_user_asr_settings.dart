import 'asr_engine_mode.dart';

class Tasmee3UserAsrSettings {
  final AsrEngineMode mode;
  final String endpoint;
  final String apiKey;
  final bool allowServerAudioUpload;
  final bool enableAutoRetry;
  final int maxRetryCount;
  final bool saveFailedSessionsQueue;

  const Tasmee3UserAsrSettings({
    required this.mode,
    required this.endpoint,
    required this.apiKey,
    required this.allowServerAudioUpload,
    required this.enableAutoRetry,
    required this.maxRetryCount,
    required this.saveFailedSessionsQueue,
  });

  const Tasmee3UserAsrSettings.defaults()
      : mode = AsrEngineMode.auto,
        endpoint = '',
        apiKey = '',
        allowServerAudioUpload = false,
        enableAutoRetry = true,
        maxRetryCount = 2,
        saveFailedSessionsQueue = true;

  bool get hasEndpoint => endpoint.trim().isNotEmpty;

  bool get canUseAdvancedServer {
    return allowServerAudioUpload && hasEndpoint;
  }

  Tasmee3UserAsrSettings copyWith({
    AsrEngineMode? mode,
    String? endpoint,
    String? apiKey,
    bool? allowServerAudioUpload,
    bool? enableAutoRetry,
    int? maxRetryCount,
    bool? saveFailedSessionsQueue,
  }) {
    return Tasmee3UserAsrSettings(
      mode: mode ?? this.mode,
      endpoint: endpoint ?? this.endpoint,
      apiKey: apiKey ?? this.apiKey,
      allowServerAudioUpload:
          allowServerAudioUpload ?? this.allowServerAudioUpload,
      enableAutoRetry: enableAutoRetry ?? this.enableAutoRetry,
      maxRetryCount: maxRetryCount ?? this.maxRetryCount,
      saveFailedSessionsQueue:
          saveFailedSessionsQueue ?? this.saveFailedSessionsQueue,
    );
  }
}
