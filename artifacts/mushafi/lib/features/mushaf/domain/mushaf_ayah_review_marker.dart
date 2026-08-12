class MushafAyahReviewMarker {
  final String id;
  final int surah;
  final int ayah;
  final int mistakesCount;
  final double accuracy;
  final String source;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MushafAyahReviewMarker({
    required this.id,
    required this.surah,
    required this.ayah,
    required this.mistakesCount,
    required this.accuracy,
    required this.source,
    required this.createdAt,
    required this.updatedAt,
  });

  String get key => '$surah:$ayah';

  bool get needsReview => mistakesCount > 0 || accuracy < 0.85;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'surah': surah,
      'ayah': ayah,
      'mistakesCount': mistakesCount,
      'accuracy': accuracy,
      'source': source,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory MushafAyahReviewMarker.fromJson(Map<String, dynamic> json) {
    return MushafAyahReviewMarker(
      id: json['id'] as String,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      mistakesCount: json['mistakesCount'] as int? ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0,
      source: json['source'] as String? ?? 'tasmee3',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
