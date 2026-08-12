class MushafFavoriteAyah {
  final String id;
  final int surah;
  final int ayah;
  final DateTime createdAt;

  const MushafFavoriteAyah({
    required this.id,
    required this.surah,
    required this.ayah,
    required this.createdAt,
  });

  String get key => '$surah:$ayah';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'surah': surah,
      'ayah': ayah,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory MushafFavoriteAyah.fromJson(Map<String, dynamic> json) {
    return MushafFavoriteAyah(
      id: json['id'] as String,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
