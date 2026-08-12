import 'package:equatable/equatable.dart';

class Surah extends Equatable {
  const Surah({
    required this.id,
    required this.nameArabic,
    required this.nameTransliteration,
    required this.revelationType,
    required this.ayahCount,
    required this.startPage,
    required this.startJuz,
    this.bismillahPre = true,
  });

  final int id;
  final String nameArabic;
  final String nameTransliteration;
  final String revelationType; // Meccan | Medinan
  final int ayahCount;
  final int startPage;
  final int startJuz;
  /// false for التوبة
  final bool bismillahPre;

  @override
  List<Object?> get props => [id, nameArabic, ayahCount, startPage];
}
