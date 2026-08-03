class MushafBookmark {
  final String id;
  final int pageNumber;
  final int surah;
  final int ayah;
  final String colorHex;
  final DateTime createdAt;

  const MushafBookmark({
    required this.id,
    required this.pageNumber,
    required this.surah,
    required this.ayah,
    required this.colorHex,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pageNumber': pageNumber,
      'surah': surah,
      'ayah': ayah,
      'colorHex': colorHex,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory MushafBookmark.fromJson(Map<String, dynamic> json) {
    return MushafBookmark(
      id: json['id'] as String,
      pageNumber: json['pageNumber'] as int,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      colorHex: json['colorHex'] as String? ?? '#A77A48',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
