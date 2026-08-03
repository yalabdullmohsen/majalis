class MushafReadingPosition {
  final int pageNumber;
  final int surah;
  final int ayah;
  final DateTime updatedAt;

  const MushafReadingPosition({
    required this.pageNumber,
    required this.surah,
    required this.ayah,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'pageNumber': pageNumber,
      'surah': surah,
      'ayah': ayah,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory MushafReadingPosition.fromJson(Map<String, dynamic> json) {
    return MushafReadingPosition(
      pageNumber: json['pageNumber'] as int,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
