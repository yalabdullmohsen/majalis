import '../domain/mushaf_reading_settings.dart';

abstract class MushafReadingSettingsRepository {
  Future<MushafReadingSettings> load();

  Future<void> save(MushafReadingSettings settings);

  Future<void> reset();
}
