class TafsirSource {
  final String id;
  final String nameArabic;
  final String assetPath;
  final bool isDefault;

  const TafsirSource({
    required this.id,
    required this.nameArabic,
    required this.assetPath,
    this.isDefault = false,
  });
}
