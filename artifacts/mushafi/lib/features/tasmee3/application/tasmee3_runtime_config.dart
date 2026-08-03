/// Compile-time / environment defaults for Tasmee3 ASR.
///
/// Dart-define values may seed endpoints for developer builds, but must never
/// enable external audio upload without an explicit user preference.
class Tasmee3RuntimeConfig {
  final String defaultHttpAsrEndpoint;
  final String defaultWebSocketEndpoint;
  final bool enableExperimentalPcm;
  final bool enableDebugDiagnostics;
  final bool allowExternalAudioUploadByDefault;

  const Tasmee3RuntimeConfig({
    this.defaultHttpAsrEndpoint = '',
    this.defaultWebSocketEndpoint = '',
    this.enableExperimentalPcm = false,
    this.enableDebugDiagnostics = false,
    this.allowExternalAudioUploadByDefault = false,
  });

  factory Tasmee3RuntimeConfig.fromEnvironment() {
    return const Tasmee3RuntimeConfig(
      defaultHttpAsrEndpoint: String.fromEnvironment(
        'TASMEE3_ASR_ENDPOINT',
        defaultValue: '',
      ),
      defaultWebSocketEndpoint: String.fromEnvironment(
        'TASMEE3_ASR_WS_ENDPOINT',
        defaultValue: '',
      ),
      enableExperimentalPcm: bool.fromEnvironment(
        'TASMEE3_ENABLE_EXPERIMENTAL_PCM',
        defaultValue: false,
      ),
      enableDebugDiagnostics: bool.fromEnvironment(
        'TASMEE3_DEBUG_DIAGNOSTICS',
        defaultValue: false,
      ),
      allowExternalAudioUploadByDefault: bool.fromEnvironment(
        'TASMEE3_ALLOW_EXTERNAL_AUDIO_UPLOAD',
        defaultValue: false,
      ),
    );
  }
}
