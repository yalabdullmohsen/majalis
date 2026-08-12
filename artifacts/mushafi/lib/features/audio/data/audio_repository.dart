import 'package:mushafi/features/audio/domain/reciter.dart';
import 'package:mushafi/features/quran/domain/entities/ayah.dart';

/// مصدر الصوت — يدعم everyayah بنمط mock قابل للاستبدال.
class AudioRepository {
  static const defaultReciters = [
    Reciter(
      id: 'alafasy',
      nameArabic: 'مشاري العفاسي',
      nameEnglish: 'Mishary Alafasy',
      style: 'مرتل',
      audioBaseUrl: 'https://everyayah.com/data/Alafasy_128kbps/',
      isMockRemote: true,
    ),
  ];

  List<Reciter> listReciters() => defaultReciters;

  Reciter byId(String id) =>
      defaultReciters.firstWhere((r) => r.id == id, orElse: () => defaultReciters.first);

  /// everyayah: SSSAA.mp3
  Uri ayahUrl(Reciter reciter, Ayah ayah) {
    final s = ayah.surahId.toString().padLeft(3, '0');
    final a = ayah.ayahNumber.toString().padLeft(3, '0');
    return Uri.parse('${reciter.audioBaseUrl}$s$a.mp3');
  }
}
