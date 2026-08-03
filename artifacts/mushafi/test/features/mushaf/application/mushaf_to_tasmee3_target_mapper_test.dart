import 'package:flutter_test/flutter_test.dart';

import 'package:mushafi/features/mushaf/application/mushaf_to_tasmee3_target_mapper.dart';
import 'package:mushafi/features/tasmee3/domain/ayah_ref.dart';
import 'package:mushafi/features/tasmee3/domain/quran_ayah.dart';
import 'package:mushafi/features/tasmee3/domain/recitation_target.dart';

void main() {
  group('MushafToTasmee3TargetMapper', () {
    const mapper = MushafToTasmee3TargetMapper();

    test('maps one ayah to target', () {
      final target = mapper.fromAyahs(
        const [
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 1),
            textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
          ),
        ],
      );

      expect(target.from.surah, 112);
      expect(target.from.ayah, 1);
      expect(target.to.surah, 112);
      expect(target.to.ayah, 1);
      expect(target.mode, Tasmee3Mode.hifzTest);
    });

    test('sorts selected ayahs before mapping', () {
      final target = mapper.fromAyahs(
        const [
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 4),
            textUthmani: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
          ),
          QuranAyah(
            ref: AyahRef(surah: 112, ayah: 1),
            textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
          ),
        ],
      );

      expect(target.from.ayah, 1);
      expect(target.to.ayah, 4);
    });

    test('throws for empty ayahs', () {
      expect(
        () => mapper.fromAyahs(const []),
        throwsStateError,
      );
    });
  });
}
