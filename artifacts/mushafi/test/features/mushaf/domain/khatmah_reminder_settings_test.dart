import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/domain/khatmah_reminder_settings.dart';

void main() {
  group('KhatmahReminderSettings', () {
    test('defaults are disabled', () {
      const settings = KhatmahReminderSettings.defaults();

      expect(settings.enabled, false);
      expect(settings.lateReminderEnabled, false);
      expect(settings.timeLabel, '20:00');
      expect(settings.lateTimeLabel, '21:00');
    });

    test('serializes and deserializes', () {
      const settings = KhatmahReminderSettings.defaults();

      final restored = KhatmahReminderSettings.fromJson(settings.toJson());

      expect(restored.enabled, settings.enabled);
      expect(restored.hour, settings.hour);
      expect(restored.minute, settings.minute);
    });
  });
}
