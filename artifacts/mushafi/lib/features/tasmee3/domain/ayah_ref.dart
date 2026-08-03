class AyahRef {
  final int surah;
  final int ayah;

  const AyahRef({
    required this.surah,
    required this.ayah,
  });

  String get key => '$surah:$ayah';

  @override
  bool operator ==(Object other) {
    return other is AyahRef &&
        other.surah == surah &&
        other.ayah == ayah;
  }

  @override
  int get hashCode => Object.hash(surah, ayah);

  @override
  String toString() => key;
}
