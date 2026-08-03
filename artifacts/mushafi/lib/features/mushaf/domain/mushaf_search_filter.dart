class MushafSearchFilter {
  final int? surah;
  final int? juz;
  final bool includeQuranText;
  final bool includeTafsir;
  final int limit;

  const MushafSearchFilter({
    this.surah,
    this.juz,
    this.includeQuranText = true,
    this.includeTafsir = false,
    this.limit = 80,
  });

  const MushafSearchFilter.defaults()
      : surah = null,
        juz = null,
        includeQuranText = true,
        includeTafsir = false,
        limit = 80;

  bool get hasSurahFilter => surah != null;
  bool get hasJuzFilter => juz != null;
  bool get hasAnyFilter => hasSurahFilter || hasJuzFilter || includeTafsir;

  MushafSearchFilter copyWith({
    int? surah,
    bool clearSurah = false,
    int? juz,
    bool clearJuz = false,
    bool? includeQuranText,
    bool? includeTafsir,
    int? limit,
  }) {
    return MushafSearchFilter(
      surah: clearSurah ? null : surah ?? this.surah,
      juz: clearJuz ? null : juz ?? this.juz,
      includeQuranText: includeQuranText ?? this.includeQuranText,
      includeTafsir: includeTafsir ?? this.includeTafsir,
      limit: limit ?? this.limit,
    );
  }
}
