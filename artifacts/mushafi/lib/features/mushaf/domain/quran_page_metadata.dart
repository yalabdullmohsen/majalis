class QuranPageMetadata {
  final int pageNumber;
  final int juz;
  final int hizb;
  final int rub;
  final int fromSurah;
  final int fromAyah;
  final int toSurah;
  final int toAyah;

  const QuranPageMetadata({
    required this.pageNumber,
    required this.juz,
    required this.hizb,
    required this.rub,
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
  });

  factory QuranPageMetadata.fromJson(Map<String, dynamic> json) {
    return QuranPageMetadata(
      pageNumber: json['pageNumber'] as int,
      juz: json['juz'] as int? ?? 0,
      hizb: json['hizb'] as int? ?? 0,
      rub: json['rub'] as int? ?? 0,
      fromSurah: json['fromSurah'] as int,
      fromAyah: json['fromAyah'] as int,
      toSurah: json['toSurah'] as int,
      toAyah: json['toAyah'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pageNumber': pageNumber,
      'juz': juz,
      'hizb': hizb,
      'rub': rub,
      'fromSurah': fromSurah,
      'fromAyah': fromAyah,
      'toSurah': toSurah,
      'toAyah': toAyah,
    };
  }

  bool containsAyah({
    required int surah,
    required int ayah,
  }) {
    if (fromSurah == toSurah) {
      return surah == fromSurah && ayah >= fromAyah && ayah <= toAyah;
    }

    if (surah == fromSurah) {
      return ayah >= fromAyah;
    }

    if (surah == toSurah) {
      return ayah <= toAyah;
    }

    return surah > fromSurah && surah < toSurah;
  }
}
