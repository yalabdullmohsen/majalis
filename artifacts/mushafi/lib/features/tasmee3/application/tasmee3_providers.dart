import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/advanced_quran_asr_recognizer.dart';
import '../data/assets_quran_repository.dart';
import '../data/local_tasmee3_session_repository.dart';
import '../data/quran_repository.dart';
import '../data/quran_speech_recognizer.dart';
import '../data/speech_to_text_quran_recognizer.dart';
import '../data/tasmee3_session_repository.dart';
import '../domain/tasmee3_session_record.dart';
import 'mistake_detection_engine.dart';
import 'tasmee3_asr_settings.dart';
import 'tasmee3_controller.dart';
import 'tasmee3_ui_settings.dart';

/// Named distinctly from mushaf `quranRepositoryProvider` to avoid import clashes
/// when both libraries are imported in the same file.
final quranRepositoryProvider = Provider<QuranRepository>((ref) {
  return AssetsQuranRepository();
});

final tasmee3AsrSettingsProvider = Provider<Tasmee3AsrSettings>((ref) {
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
});

/// Uses Advanced ASR when `TASMEE3_ASR_ENDPOINT` is set; otherwise speech_to_text fallback.
final quranSpeechRecognizerProvider = Provider<QuranSpeechRecognizer>((ref) {
  final settings = ref.watch(tasmee3AsrSettingsProvider);

  if (settings.isConfigured) {
    return AdvancedQuranAsrRecognizer(
      endpoint: Uri.parse(settings.endpoint!),
      apiKey: settings.apiKey,
      uploadTimeout: settings.uploadTimeout,
    );
  }

  return SpeechToTextQuranRecognizer();
});

final mistakeDetectionEngineProvider = Provider<MistakeDetectionEngine>((ref) {
  return const MistakeDetectionEngine();
});

final tasmee3UiSettingsProvider = Provider<Tasmee3UiSettings>((ref) {
  return const Tasmee3UiSettings();
});

final tasmee3SessionRepositoryProvider =
    Provider<Tasmee3SessionRepository>((ref) {
  return LocalTasmee3SessionRepository();
});

final tasmee3SessionHistoryProvider =
    FutureProvider<List<Tasmee3SessionRecord>>((ref) async {
  final repository = ref.watch(tasmee3SessionRepositoryProvider);
  return repository.getSessions();
});

final tasmee3ControllerProvider =
    StateNotifierProvider<Tasmee3Controller, Tasmee3State>((ref) {
  return Tasmee3Controller(
    quranRepository: ref.watch(quranRepositoryProvider),
    recognizer: ref.watch(quranSpeechRecognizerProvider),
    engine: ref.watch(mistakeDetectionEngineProvider),
    sessionRepository: ref.watch(tasmee3SessionRepositoryProvider),
    onSessionSaved: () => ref.invalidate(tasmee3SessionHistoryProvider),
  );
});
