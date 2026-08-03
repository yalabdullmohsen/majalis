import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/asr_server_health_service.dart';
import '../data/tasmee3_asr_settings_repository.dart';
import '../domain/asr_connection_status.dart';
import '../domain/tasmee3_user_asr_settings.dart';

class Tasmee3AsrSettingsState {
  final Tasmee3UserAsrSettings settings;
  final AsrConnectionStatus connectionStatus;
  final bool isSaving;
  final bool isChecking;
  final String? errorMessage;

  const Tasmee3AsrSettingsState({
    required this.settings,
    required this.connectionStatus,
    this.isSaving = false,
    this.isChecking = false,
    this.errorMessage,
  });

  Tasmee3AsrSettingsState copyWith({
    Tasmee3UserAsrSettings? settings,
    AsrConnectionStatus? connectionStatus,
    bool? isSaving,
    bool? isChecking,
    String? errorMessage,
  }) {
    return Tasmee3AsrSettingsState(
      settings: settings ?? this.settings,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      isSaving: isSaving ?? this.isSaving,
      isChecking: isChecking ?? this.isChecking,
      errorMessage: errorMessage,
    );
  }
}

class Tasmee3AsrSettingsController
    extends StateNotifier<Tasmee3AsrSettingsState> {
  final Tasmee3AsrSettingsRepository repository;
  final AsrServerHealthService healthService;

  Tasmee3AsrSettingsController({
    required this.repository,
    required this.healthService,
    required Tasmee3UserAsrSettings initialSettings,
  }) : super(
          Tasmee3AsrSettingsState(
            settings: initialSettings,
            connectionStatus: AsrConnectionStatus.unknown(),
          ),
        );

  void updateSettings(Tasmee3UserAsrSettings settings) {
    state = state.copyWith(settings: settings, errorMessage: null);
  }

  Future<void> save() async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.save(state.settings);
      state = state.copyWith(isSaving: false);
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> checkConnection() async {
    state = state.copyWith(isChecking: true, errorMessage: null);

    final status = await healthService.check(
      endpoint: state.settings.endpoint,
      apiKey: state.settings.apiKey,
    );

    state = state.copyWith(
      isChecking: false,
      connectionStatus: status,
    );
  }

  Future<void> reset() async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.clear();
      state = Tasmee3AsrSettingsState(
        settings: const Tasmee3UserAsrSettings.defaults(),
        connectionStatus: AsrConnectionStatus.unknown(),
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }
}
