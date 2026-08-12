import '../domain/tasmee3_user_asr_settings.dart';

abstract class Tasmee3AsrSettingsRepository {
  Future<Tasmee3UserAsrSettings> load();

  Future<void> save(Tasmee3UserAsrSettings settings);

  Future<void> clear();
}
