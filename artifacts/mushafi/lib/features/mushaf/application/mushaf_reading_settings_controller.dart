import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mushaf_reading_settings_repository.dart';
import '../domain/mushaf_reading_settings.dart';

class MushafReadingSettingsState {
  final MushafReadingSettings settings;
  final bool isLoading;
  final bool isSaving;
  final String? errorMessage;

  const MushafReadingSettingsState({
    required this.settings,
    this.isLoading = false,
    this.isSaving = false,
    this.errorMessage,
  });

  MushafReadingSettingsState copyWith({
    MushafReadingSettings? settings,
    bool? isLoading,
    bool? isSaving,
    String? errorMessage,
  }) {
    return MushafReadingSettingsState(
      settings: settings ?? this.settings,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: errorMessage,
    );
  }
}

class MushafReadingSettingsController
    extends StateNotifier<MushafReadingSettingsState> {
  final MushafReadingSettingsRepository repository;

  MushafReadingSettingsController({
    required this.repository,
    required MushafReadingSettings initialSettings,
  }) : super(MushafReadingSettingsState(settings: initialSettings));

  Future<void> load() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final settings = await repository.load();
      state = state.copyWith(
        settings: settings,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void update(MushafReadingSettings settings) {
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

  Future<void> reset() async {
    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      await repository.reset();

      state = const MushafReadingSettingsState(
        settings: MushafReadingSettings.defaults(),
      );
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: e.toString(),
      );
    }
  }
}
