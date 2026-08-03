import 'package:equatable/equatable.dart';

class Reciter extends Equatable {
  const Reciter({
    required this.id,
    required this.nameArabic,
    required this.nameEnglish,
    required this.style,
    required this.audioBaseUrl,
    this.supportsAyahTiming = false,
    this.supportsWordTiming = false,
    this.isMockRemote = true,
  });

  final String id;
  final String nameArabic;
  final String nameEnglish;
  final String style;
  final String audioBaseUrl;
  final bool supportsAyahTiming;
  final bool supportsWordTiming;
  final bool isMockRemote;

  @override
  List<Object?> get props => [id];
}
