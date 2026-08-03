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

  factory Tasmee3AsrSettings.fromEnvironment() {
    const endpoint = String.fromEnvironment(
      'TASMEE3_ASR_ENDPOINT',
      defaultValue: '',
    );
    const apiKey = String.fromEnvironment(
      'TASMEE3_ASR_API_KEY',
      defaultValue: '',
    );

    return Tasmee3AsrSettings(
      useAdvancedAsr: true,
      endpoint: endpoint.isEmpty ? null : endpoint,
      apiKey: apiKey.isEmpty ? null : apiKey,
    );
  }
}
