import '../../tasmee3/domain/ayah_ref.dart';
import '../../tasmee3/domain/quran_ayah.dart';
import '../../tasmee3/domain/recitation_target.dart';

class MushafToTasmee3TargetMapper {
  const MushafToTasmee3TargetMapper();

  RecitationTarget fromAyahs(
    List<QuranAyah> ayahs, {
    Tasmee3Mode mode = Tasmee3Mode.hifzTest,
  }) {
    if (ayahs.isEmpty) {
      throw StateError('لا توجد آيات محددة للتسميع.');
    }

    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);
      if (surahCompare != 0) return surahCompare;
      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    final first = sorted.first;
    final last = sorted.last;

    return RecitationTarget(
      from: AyahRef(
        surah: first.ref.surah,
        ayah: first.ref.ayah,
      ),
      to: AyahRef(
        surah: last.ref.surah,
        ayah: last.ref.ayah,
      ),
      mode: mode,
    );
  }
}
