import '../domain/tafsir_source.dart';

class TafsirCatalog {
  static const List<TafsirSource> sources = [
    TafsirSource(
      id: 'muyassar',
      nameArabic: 'التفسير الميسر',
      assetPath: 'assets/tafsir/tafsir_muyassar.json',
      isDefault: true,
    ),
  ];

  static TafsirSource defaultSource() {
    return sources.firstWhere(
      (source) => source.isDefault,
      orElse: () => sources.first,
    );
  }
}
