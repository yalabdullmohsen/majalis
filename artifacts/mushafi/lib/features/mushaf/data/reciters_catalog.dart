import '../domain/quran_reciter.dart';

/// Catalog of reciters. Audio URLs must be licensed before enabling playback.
class RecitersCatalog {
  static const List<QuranReciter> all = [
    QuranReciter(
      id: 'husary',
      nameArabic: 'محمود خليل الحصري',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      supportsGapless: false,
      supportsAyahTiming: false,
    ),
    QuranReciter(
      id: 'minshawi',
      nameArabic: 'محمد صديق المنشاوي',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      supportsGapless: false,
      supportsAyahTiming: false,
    ),
    QuranReciter(
      id: 'afasy',
      nameArabic: 'مشاري راشد العفاسي',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      supportsGapless: false,
      supportsAyahTiming: false,
    ),
  ];

  static QuranReciter byId(String id) {
    return all.firstWhere(
      (reciter) => reciter.id == id,
      orElse: () => all.first,
    );
  }
}
