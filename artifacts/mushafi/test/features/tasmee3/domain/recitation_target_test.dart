import 'package:flutter_test/flutter_test.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';

void main() {
  group('RecitationTarget', () {
    test('isValid for same-surah ascending range', () {
      const target = RecitationTarget(
        from: AyahRef(surah: 112, ayah: 1),
        to: AyahRef(surah: 112, ayah: 4),
        mode: Tasmee3Mode.hifzTest,
      );

      expect(target.isValid, isTrue);
      expect(target.contains(const AyahRef(surah: 112, ayah: 2)), isTrue);
      expect(target.contains(const AyahRef(surah: 1, ayah: 1)), isFalse);
    });
  });
}
