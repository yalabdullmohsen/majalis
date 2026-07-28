import '../../shared/models/shared_quran_verse.dart';

/// Sample Quran repository for Phase 1 (Al-Fatiha + tafsir snippets).
class UserQuranRepository {
  UserQuranRepository._();

  static const List<SharedQuranVerse> _fatiha = [
    SharedQuranVerse(
      id: '1:1',
      surah: 1,
      ayah: 1,
      surahNameAr: 'الفاتحة',
      textUthmani: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      tafsir:
          'افتتح الله كتابه بالبسملة؛ وفيها تعليم للعبد أن يبدأ أموره باسم الله.',
    ),
    SharedQuranVerse(
      id: '1:2',
      surah: 1,
      ayah: 2,
      surahNameAr: 'الفاتحة',
      textUthmani: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      tafsir: 'الثناء الكامل لله الذي ربّى العالمين بنعمه.',
    ),
    SharedQuranVerse(
      id: '1:3',
      surah: 1,
      ayah: 3,
      surahNameAr: 'الفاتحة',
      textUthmani: 'الرَّحْمَٰنِ الرَّحِيمِ',
      tafsir: 'صفتان دالتان على سعة رحمة الله العامة والخاصة.',
    ),
    SharedQuranVerse(
      id: '1:4',
      surah: 1,
      ayah: 4,
      surahNameAr: 'الفاتحة',
      textUthmani: 'مَالِكِ يَوْمِ الدِّينِ',
      tafsir: 'الملك الحق ليوم الجزاء والحساب.',
    ),
    SharedQuranVerse(
      id: '1:5',
      surah: 1,
      ayah: 5,
      surahNameAr: 'الفاتحة',
      textUthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      tafsir: 'قصر العبادة والاستعانة على الله وحده.',
    ),
    SharedQuranVerse(
      id: '1:6',
      surah: 1,
      ayah: 6,
      surahNameAr: 'الفاتحة',
      textUthmani: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      tafsir: 'طلب الهداية إلى طريق الحق الواضح.',
    ),
    SharedQuranVerse(
      id: '1:7',
      surah: 1,
      ayah: 7,
      surahNameAr: 'الفاتحة',
      textUthmani:
          'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
      tafsir: 'صراط المنعَم عليهم من النبيين والصديقين، لا المغضوب عليهم ولا الضالين.',
    ),
  ];

  static List<SharedQuranVerse> getVerses({int surah = 1}) {
    if (surah == 1) return List<SharedQuranVerse>.unmodifiable(_fatiha);
    return const [];
  }

  static SharedQuranVerse? getByIndex(int index, {int surah = 1}) {
    final list = getVerses(surah: surah);
    if (index < 0 || index >= list.length) return null;
    return list[index];
  }

  static String? getTafsir(int index, {int surah = 1}) =>
      getByIndex(index, surah: surah)?.tafsir;
}
