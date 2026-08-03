import 'package:equatable/equatable.dart';

class AyahWord extends Equatable {
  const AyahWord({required this.index, required this.text});
  final int index;
  final String text;
  @override
  List<Object?> get props => [index, text];
}

class Ayah extends Equatable {
  const Ayah({
    required this.surahId,
    required this.ayahNumber,
    required this.globalAyahNumber,
    required this.pageNumber,
    required this.juzNumber,
    required this.hizbQuarter,
    required this.textUthmani,
    required this.textPlain,
    required this.words,
    this.sajdahType,
  });

  final int surahId;
  final int ayahNumber;
  final int globalAyahNumber;
  final int pageNumber;
  final int juzNumber;
  /// 1..240 ربع الحزب
  final int hizbQuarter;
  final String textUthmani;
  final String textPlain;
  final List<AyahWord> words;
  final String? sajdahType;

  String get key => '$surahId:$ayahNumber';

  @override
  List<Object?> get props => [surahId, ayahNumber, textUthmani, pageNumber];
}
