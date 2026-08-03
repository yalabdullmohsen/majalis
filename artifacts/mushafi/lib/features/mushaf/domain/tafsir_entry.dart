class TafsirEntry {
  final int surah;
  final int ayah;
  final String text;

  const TafsirEntry({
    required this.surah,
    required this.ayah,
    required this.text,
  });

  String get key => '$surah:$ayah';

  factory TafsirEntry.fromJson(Map<String, dynamic> json) {
    return TafsirEntry(
      surah: json['surah'] as int,
      ayah: json['ayah'] as int,
      text: json['text'] as String? ?? '',
    );
  }
}
