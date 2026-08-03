class QuranReciter {
  final String id;
  final String nameArabic;
  final String riwayah;
  final String audioBaseUrl;
  final String fileExtension;
  final bool supportsGapless;
  final bool supportsAyahTiming;

  const QuranReciter({
    required this.id,
    required this.nameArabic,
    required this.riwayah,
    required this.audioBaseUrl,
    this.fileExtension = 'mp3',
    this.supportsGapless = false,
    this.supportsAyahTiming = false,
  });

  bool get isConfigured => audioBaseUrl.trim().isNotEmpty;

  /// Builds a common padded ayah URL. Verify against the licensed source
  /// template before enabling playback in production.
  String ayahUrl({
    required int surah,
    required int ayah,
  }) {
    final base = audioBaseUrl.endsWith('/')
        ? audioBaseUrl.substring(0, audioBaseUrl.length - 1)
        : audioBaseUrl;

    final surahPadded = surah.toString().padLeft(3, '0');
    final ayahPadded = ayah.toString().padLeft(3, '0');

    return '$base/$surahPadded$ayahPadded.$fileExtension';
  }
}
