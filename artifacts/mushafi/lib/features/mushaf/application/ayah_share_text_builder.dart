import '../../tasmee3/domain/quran_ayah.dart';

class AyahShareTextBuilder {
  const AyahShareTextBuilder();

  String buildText(List<QuranAyah> ayahs) {
    if (ayahs.isEmpty) {
      return '';
    }

    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);

      if (surahCompare != 0) {
        return surahCompare;
      }

      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    final buffer = StringBuffer();

    for (final ayah in sorted) {
      buffer.writeln(
        '${ayah.textUthmani} (${ayah.ref.surah}:${ayah.ref.ayah})',
      );
    }

    buffer.writeln();
    buffer.writeln('مشاركة من تطبيق مصحفي');

    return buffer.toString().trim();
  }

  String buildReference(List<QuranAyah> ayahs) {
    if (ayahs.isEmpty) return '';

    final sorted = [...ayahs];

    sorted.sort((a, b) {
      final surahCompare = a.ref.surah.compareTo(b.ref.surah);

      if (surahCompare != 0) {
        return surahCompare;
      }

      return a.ref.ayah.compareTo(b.ref.ayah);
    });

    final first = sorted.first;
    final last = sorted.last;

    if (first.ref.surah == last.ref.surah && first.ref.ayah == last.ref.ayah) {
      return 'سورة ${first.ref.surah} - آية ${first.ref.ayah}';
    }

    if (first.ref.surah == last.ref.surah) {
      return 'سورة ${first.ref.surah} - من آية ${first.ref.ayah} إلى ${last.ref.ayah}';
    }

    return 'من سورة ${first.ref.surah} آية ${first.ref.ayah} إلى سورة ${last.ref.surah} آية ${last.ref.ayah}';
  }
}
