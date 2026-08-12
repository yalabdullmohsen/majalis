class MushafTasmee3LastRange {
  final int fromSurah;
  final int fromAyah;
  final int toSurah;
  final int toAyah;
  final DateTime updatedAt;

  const MushafTasmee3LastRange({
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'fromSurah': fromSurah,
      'fromAyah': fromAyah,
      'toSurah': toSurah,
      'toAyah': toAyah,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory MushafTasmee3LastRange.fromJson(Map<String, dynamic> json) {
    return MushafTasmee3LastRange(
      fromSurah: json['fromSurah'] as int,
      fromAyah: json['fromAyah'] as int,
      toSurah: json['toSurah'] as int,
      toAyah: json['toAyah'] as int,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
