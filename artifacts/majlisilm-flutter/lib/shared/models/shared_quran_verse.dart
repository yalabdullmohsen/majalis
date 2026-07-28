/// Shared Quran verse model — used by UserApp (Phase 1) and AdminPanel (Phase 2).
class SharedQuranVerse {
  const SharedQuranVerse({
    required this.id,
    required this.surah,
    required this.ayah,
    required this.textUthmani,
    this.tafsir = '',
    this.surahNameAr = '',
  });

  final String id;
  final int surah;
  final int ayah;
  final String textUthmani;
  final String tafsir;
  final String surahNameAr;

  String get verseRef =>
      surahNameAr.isEmpty ? '$surah:$ayah' : '$surahNameAr $ayah';

  SharedQuranVerse copyWith({
    String? id,
    int? surah,
    int? ayah,
    String? textUthmani,
    String? tafsir,
    String? surahNameAr,
  }) {
    return SharedQuranVerse(
      id: id ?? this.id,
      surah: surah ?? this.surah,
      ayah: ayah ?? this.ayah,
      textUthmani: textUthmani ?? this.textUthmani,
      tafsir: tafsir ?? this.tafsir,
      surahNameAr: surahNameAr ?? this.surahNameAr,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'surah': surah,
        'ayah': ayah,
        'textUthmani': textUthmani,
        'tafsir': tafsir,
        'surahNameAr': surahNameAr,
      };

  factory SharedQuranVerse.fromJson(Map<String, dynamic> json) {
    return SharedQuranVerse(
      id: json['id'] as String? ?? '',
      surah: json['surah'] as int? ?? 1,
      ayah: json['ayah'] as int? ?? 1,
      textUthmani: json['textUthmani'] as String? ?? '',
      tafsir: json['tafsir'] as String? ?? '',
      surahNameAr: json['surahNameAr'] as String? ?? '',
    );
  }
}
