class Tasmee3AsrSettings {
  final bool useAdvancedAsr;
  final String? endpoint;
  final String? apiKey;
  final Duration uploadTimeout;

  const Tasmee3AsrSettings({
    required this.useAdvancedAsr,
    this.endpoint,
    this.apiKey,
    this.uploadTimeout = const Duration(seconds: 90),
  });

  bool get isConfigured {
    return useAdvancedAsr &&
        endpoint != null &&
        endpoint!.trim().isNotEmpty;
  }
}
