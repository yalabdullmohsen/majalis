import 'ayah_ref.dart';

class QuranAyah {
  final AyahRef ref;
  final String textUthmani;

  const QuranAyah({
    required this.ref,
    required this.textUthmani,
  });

  factory QuranAyah.fromJson(Map<String, dynamic> json) {
    return QuranAyah(
      ref: AyahRef(
        surah: json['surah'] as int,
        ayah: json['ayah'] as int,
      ),
      textUthmani: json['textUthmani'] as String,
    );
  }
}
