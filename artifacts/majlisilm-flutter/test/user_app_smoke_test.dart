import 'package:flutter_test/flutter_test.dart';
import 'package:majlisilm_flutter/shared/constants/majlis_constants.dart';
import 'package:majlisilm_flutter/shared/models/shared_quran_verse.dart';
import 'package:majlisilm_flutter/user_app/data/user_quran_repository.dart';

void main() {
  test('Fatiha sample has 7 verses', () {
    expect(UserQuranRepository.getVerses().length, 7);
    expect(UserQuranRepository.getByIndex(0)?.textUthmani.isNotEmpty, isTrue);
  });

  test('ayah audio URL pads surah/ayah', () {
    expect(
      MajlisConstants.ayahAudioUrl(1, 5),
      'https://everyayah.com/data/Alafasy_128kbps/001005.mp3',
    );
  });

  test('SharedQuranVerse json roundtrip', () {
    const v = SharedQuranVerse(
      id: '1:1',
      surah: 1,
      ayah: 1,
      textUthmani: 'بِسْمِ',
      tafsir: 't',
      surahNameAr: 'الفاتحة',
    );
    final back = SharedQuranVerse.fromJson(v.toJson());
    expect(back.id, v.id);
    expect(back.ayah, 1);
  });
}
