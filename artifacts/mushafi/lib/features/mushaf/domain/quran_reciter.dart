class QuranReciter {
  final String id;
  final String nameArabic;
  final String riwayah;
  final String audioBaseUrl;
  final bool supportsGapless;
  final bool supportsAyahTiming;

  const QuranReciter({
    required this.id,
    required this.nameArabic,
    required this.riwayah,
    required this.audioBaseUrl,
    this.supportsGapless = false,
    this.supportsAyahTiming = false,
  });
}
