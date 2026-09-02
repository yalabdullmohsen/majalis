export type RecitationScope = "surah" | "ayah" | "page" | "juz";

export type RecitationSetupConfig = {
  scope: RecitationScope;
  surahNumber: number;
  ayahFrom: number;
  ayahTo: number;
  pageNumber: number;
  juzNumber: number;
  matchingStrict: boolean;
};
