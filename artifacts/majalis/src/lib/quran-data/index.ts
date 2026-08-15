/**
 * طبقة بيانات القرآن النظيفة — بدون UI.
 * مصدر النص: public/data/quran + public/data/quran-v2 (QPC) عبر اللوادر أدناه.
 */

import {
  fetchSurahDetail,
  getSurahList,
  getSurahMeta,
  type Ayah,
  type StaticSurahMeta,
  type SurahDetail,
} from "@/lib/quran-api";
import { fetchPage, type PageContent } from "@/lib/quran-pages";
import {
  loadMushafPage,
  type MushafPageLayout,
  type QpcWord,
} from "@/lib/quran-data/qpc-page-data";

export type { StaticSurahMeta, SurahDetail, Ayah, PageContent, MushafPageLayout, QpcWord };

/** قائمة السور الـ١١٤ (ميتا بيانات ثابتة). */
export function getSurahs(): StaticSurahMeta[] {
  return getSurahList();
}

/** سورة واحدة بالمعرّف (١–١١٤). */
export function getSurahById(id: number): StaticSurahMeta {
  return getSurahMeta(id);
}

/** آيات سورة كاملة (نص عثماني من المصدر المعتمد). */
export async function getAyahsBySurah(surahId: number): Promise<Ayah[]> {
  const detail = await fetchSurahDetail(surahId);
  return detail.ayahs;
}

/**
 * كلمات آية من تخطيط QPC للصفحة إن توفّرت.
 * ayahId بصيغة "سورة:آية" مثل "1:1".
 */
export async function getWordsByAyah(ayahId: string): Promise<QpcWord[]> {
  const [s, a] = ayahId.split(":").map((x) => Number(x));
  if (!Number.isFinite(s) || !Number.isFinite(a)) return [];
  const detail = await fetchSurahDetail(s);
  const ayah = detail.ayahs.find((x) => x.numberInSurah === a);
  if (!ayah?.page) return [];
  const layout = await loadMushafPage(ayah.page);
  const verse = layout.rows
    .flatMap((row) => (row.kind === "line" ? row.words : []))
    .filter((w) => w.verseKey === `${s}:${a}`);
  // dedupe by position within ayah words from layout verses is via words on lines
  return verse;
}

/** بيانات صفحة مدينة (١–٦٠٤) — نص مجمّع من الفهرس + السور. */
export async function getPageData(pageNumber: number): Promise<PageContent> {
  return fetchPage(pageNumber);
}

/** تخطيط QPC الخام لصفحة (أسطر/كلمات) إن لزم للمصحف الجديد لاحقًا. */
export async function getQpcPageLayout(pageNumber: number): Promise<MushafPageLayout> {
  return loadMushafPage(pageNumber);
}

export { fetchSurahDetail, fetchPage, loadMushafPage };

export {
  MUSHAF_TAFSIR_EDITIONS,
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  DEFAULT_EXTENDED_TAFSIR_EDITION,
  resolveMushafTafsirEditionId,
  getMushafTafsirEdition,
  type MushafTafsirEdition,
} from "@/lib/quran-data/tafsir-editions";

export {
  MUSHAF_TRANSLATION_EDITIONS,
  DEFAULT_MUSHAF_TRANSLATION_EDITION,
  resolveMushafTranslationEditionId,
  getMushafTranslationEdition,
  type MushafTranslationEdition,
} from "@/lib/quran-data/translation-editions";

export {
  fetchMushafAyahTafsir,
  fetchMushafAyahTranslation,
  clearMushafAyahContentMemory,
  type AyahContentResult,
} from "@/lib/quran-data/fetch-ayah-content";

export {
  TAFSIR_FONT_SCALES,
  readStoredTafsirEdition,
  persistTafsirEdition,
  readStoredTafsirFontScale,
  persistTafsirFontScale,
  readStoredTranslationEnabled,
  persistTranslationEnabled,
  readStoredTranslationEdition,
  persistTranslationEdition,
  type TafsirFontScale,
} from "@/lib/quran-data/reader-prefs";

export {
  prefetchOfflineTafsirForPage,
  clearOfflineTafsirPackMeta,
  isOfflineTafsirPacksEnabled,
} from "@/lib/quran-data/offline-tafsir-pack";

export {
  loadTafsirAudioCatalog,
  findTafsirAudioForAyah,
  playTafsirAudioClip,
  stopTafsirAudio,
  displayScholarLabel,
} from "@/lib/quran-data/tafsir-audio";

export { QURAN_DATA_FEATURES } from "@/lib/quran-data/flags";
