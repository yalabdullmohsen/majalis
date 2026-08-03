import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/asr_engine_mode.dart';
import '../domain/tasmee3_user_asr_settings.dart';
import 'tasmee3_asr_settings_repository.dart';

class LocalTasmee3AsrSettingsRepository
    implements Tasmee3AsrSettingsRepository {
  static const String _modeKey = 'tasmee3_asr_mode';
  static const String _endpointKey = 'tasmee3_asr_endpoint';
  static const String _allowUploadKey = 'tasmee3_allow_server_audio_upload';
  static const String _autoRetryKey = 'tasmee3_asr_auto_retry';
  static const String _maxRetryKey = 'tasmee3_asr_max_retry';
  static const String _queueKey = 'tasmee3_save_failed_queue';
  static const String _apiKeySecureKey = 'tasmee3_asr_api_key';
  static const String _liveWsEndpointKey = 'tasmee3_live_ws_endpoint';
  static const String _enableLiveWsKey = 'tasmee3_enable_live_ws';
  static const String _enableNativePcmKey = 'tasmee3_enable_native_pcm';

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  @override
  Future<Tasmee3UserAsrSettings> load() async {
    final prefs = await SharedPreferences.getInstance();

    final modeName = prefs.getString(_modeKey);
    var endpoint = prefs.getString(_endpointKey) ?? '';
    var apiKey = await _secureStorage.read(key: _apiKeySecureKey) ?? '';

    // Seed from dart-define when user has not saved settings yet.
    if (endpoint.trim().isEmpty) {
      endpoint = const String.fromEnvironment(
        'TASMEE3_ASR_ENDPOINT',
        defaultValue: '',
      );
    }
    if (apiKey.trim().isEmpty) {
      apiKey = const String.fromEnvironment(
        'TASMEE3_ASR_API_KEY',
        defaultValue: '',
      );
    }

    final mode = AsrEngineMode.values.firstWhere(
      (item) => item.name == modeName,
      orElse: () => AsrEngineMode.auto,
    );

    final liveWebSocketEndpoint = prefs.getString(_liveWsEndpointKey) ?? '';
    final enableLiveWebSocket = prefs.getBool(_enableLiveWsKey) ?? false;
    final enableNativePcmStreaming =
        prefs.getBool(_enableNativePcmKey) ?? false;

    return Tasmee3UserAsrSettings(
      mode: mode,
      endpoint: endpoint,
      apiKey: apiKey,
      allowServerAudioUpload: prefs.getBool(_allowUploadKey) ?? false,
      enableAutoRetry: prefs.getBool(_autoRetryKey) ?? true,
      maxRetryCount: prefs.getInt(_maxRetryKey) ?? 2,
      saveFailedSessionsQueue: prefs.getBool(_queueKey) ?? true,
      liveWebSocketEndpoint: liveWebSocketEndpoint,
      enableLiveWebSocket: enableLiveWebSocket,
      enableNativePcmStreaming: enableNativePcmStreaming,
    );
  }

  @override
  Future<void> save(Tasmee3UserAsrSettings settings) async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(_modeKey, settings.mode.name);
    await prefs.setString(_endpointKey, settings.endpoint);
    await prefs.setBool(_allowUploadKey, settings.allowServerAudioUpload);
    await prefs.setBool(_autoRetryKey, settings.enableAutoRetry);
    await prefs.setInt(_maxRetryKey, settings.maxRetryCount);
    await prefs.setBool(_queueKey, settings.saveFailedSessionsQueue);
    await prefs.setString(
      _liveWsEndpointKey,
      settings.liveWebSocketEndpoint,
    );
    await prefs.setBool(
      _enableLiveWsKey,
      settings.enableLiveWebSocket,
    );
    await prefs.setBool(
      _enableNativePcmKey,
      settings.enableNativePcmStreaming,
    );

    await _secureStorage.write(
      key: _apiKeySecureKey,
      value: settings.apiKey,
    );
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_modeKey);
    await prefs.remove(_endpointKey);
    await prefs.remove(_allowUploadKey);
    await prefs.remove(_autoRetryKey);
    await prefs.remove(_maxRetryKey);
    await prefs.remove(_queueKey);
    await prefs.remove(_liveWsEndpointKey);
    await prefs.remove(_enableLiveWsKey);
    await prefs.remove(_enableNativePcmKey);

    await _secureStorage.delete(key: _apiKeySecureKey);
  }
}
