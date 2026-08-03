import '../domain/quran_reciter.dart';

/// Catalog of reciters.
///
/// Audio URLs must be licensed and trusted before enabling playback.
/// Do not copy audio from other apps or use unauthorized sources.
class RecitersCatalog {
  static const List<QuranReciter> all = [
    QuranReciter(
      id: 'husary',
      nameArabic: 'محمود خليل الحصري',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      fileExtension: 'mp3',
      supportsGapless: false,
      supportsAyahTiming: false,
    ),
    QuranReciter(
      id: 'minshawi',
      nameArabic: 'محمد صديق المنشاوي',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      fileExtension: 'mp3',
      supportsGapless: false,
      supportsAyahTiming: false,
    ),
    QuranReciter(
      id: 'afasy',
      nameArabic: 'مشاري راشد العفاسي',
      riwayah: 'حفص عن عاصم',
      audioBaseUrl: '',
      fileExtension: 'mp3',
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
