import bundle from "./content-import-bundle.json";
import type { AdhkarItem } from "./adhkar-seed";

export type ImportedQuranSurah = {
  number: number;
  name: string;
  englishName?: string;
  ayahs: number;
  revelation?: string;
  summary?: string;
  themes?: string[];
};

export type ImportedQuranTopic = {
  id: string;
  title: string;
  summary: string;
  category: string;
  surahRefs?: number[];
  keywords?: string[];
};

type ImportBundle = {
  adhkar?: AdhkarItem[];
  quran_surahs?: ImportedQuranSurah[];
  quran_topics?: ImportedQuranTopic[];
};

const data = bundle as ImportBundle;

export const IMPORTED_QURAN_SURAHS: ImportedQuranSurah[] = data.quran_surahs || [];
export const IMPORTED_QURAN_TOPICS: ImportedQuranTopic[] = data.quran_topics || [];
