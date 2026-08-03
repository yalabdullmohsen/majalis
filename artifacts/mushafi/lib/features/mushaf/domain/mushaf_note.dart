class MushafNote {
  final String id;
  final int surah;
  final int ayah;
  final String text;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MushafNote({
    required this.id,
    required this.surah,
    required this.ayah,
    required this.text,
    required this.createdAt,
    required this.updatedAt,
  });

  String get key => '$surah:$ayah';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'surah': surah,
      'ayah': ayah,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory MushafNote.fromJson(Map<String, dynamic> json) {
    return MushafNote(
      id: json['id'] as String,
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      text: json['text'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
