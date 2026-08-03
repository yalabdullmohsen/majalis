import '../domain/mushaf_audio_settings.dart';

abstract class MushafAudioSettingsRepository {
  Future<MushafAudioSettings> load();

  Future<void> save(MushafAudioSettings settings);

  Future<void> reset();
}
