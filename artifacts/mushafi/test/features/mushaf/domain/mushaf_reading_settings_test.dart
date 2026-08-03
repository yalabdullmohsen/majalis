import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_font_family.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_reading_settings.dart';
import 'package:mushafi/features/mushaf/domain/mushaf_reading_theme.dart';

void main() {
  group('MushafReadingSettings', () {
    test('defaults are valid', () {
      const settings = MushafReadingSettings.defaults();

      expect(settings.fontSize, greaterThan(0));
      expect(settings.lineHeight, greaterThan(1));
      expect(settings.theme, MushafReadingTheme.sepia);
      expect(settings.fontFamily, MushafFontFamily.system);
    });

    test('serializes and deserializes', () {
      const settings = MushafReadingSettings.defaults();

      final json = settings.toJson();
      final restored = MushafReadingSettings.fromJson(json);

      expect(restored.fontSize, settings.fontSize);
      expect(restored.lineHeight, settings.lineHeight);
      expect(restored.theme, settings.theme);
    });
  });
}
