/**
 * جلب كسول لتفسير/ترجمة آية واحدة — مرحلة ٢.
 * لا يُحمَّل سور كاملة ولا حزم offlineTafsirPacks.
 */

import {
  getMushafTafsirEdition,
  type MushafTafsirEdition,
} from "@/features/mushaf/tafsir-editions";
import {
  getMushafTranslationEdition,
  type MushafTranslationEdition,
} from "@/features/mushaf/translation-editions";

const QURAN_COM = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";

const tafsirMemory = new Map<string, string>();
const translationMemory = new Map<string, string>();

function verseKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type AyahContentResult = {
  text: string;
  editionId: string;
  fromCache: boolean;
};

/**
 * تفسير آية واحدة من Quran.com حسب slug الطبعة.
 */
export async function fetchMushafAyahTafsir(
  surah: number,
  ayah: number,
  editionId: string,
  signal?: AbortSignal,
): Promise<AyahContentResult | null> {
  const edition: MushafTafsirEdition | undefined = getMushafTafsirEdition(editionId);
  if (!edition) return null;

  const key = `t:${edition.quranComSlug}:${verseKey(surah, ayah)}`;
  const mem = tafsirMemory.get(key);
  if (mem) return { text: mem, editionId: edition.id, fromCache: true };

  const url = `${QURAN_COM}/tafsirs/${encodeURIComponent(edition.quranComSlug)}/by_ayah/${surah}:${ayah}`;
  const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Quran.com tafsir: HTTP ${res.status}`);
  const json = (await res.json()) as { tafsir?: { text?: string } };
  const raw = json.tafsir?.text?.trim();
  if (!raw) return null;
  const text = stripTags(raw);
  if (!text) return null;
  tafsirMemory.set(key, text);
  return { text, editionId: edition.id, fromCache: false };
}

/**
 * ترجمة آية واحدة من AlQuran Cloud.
 */
export async function fetchMushafAyahTranslation(
  surah: number,
  ayah: number,
  editionId: string,
  signal?: AbortSignal,
): Promise<AyahContentResult | null> {
  const edition: MushafTranslationEdition | undefined = getMushafTranslationEdition(editionId);
  if (!edition) return null;

  const key = `tr:${edition.alquranEdition}:${verseKey(surah, ayah)}`;
  const mem = translationMemory.get(key);
  if (mem) return { text: mem, editionId: edition.id, fromCache: true };

  const url = `${ALQURAN}/ayah/${surah}:${ayah}/${encodeURIComponent(edition.alquranEdition)}`;
  const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`AlQuran translation: HTTP ${res.status}`);
  const json = (await res.json()) as { code?: number; data?: { text?: string } };
  if (json.code !== 200 || !json.data?.text?.trim()) return null;
  const text = stripTags(json.data.text);
  if (!text) return null;
  translationMemory.set(key, text);
  return { text, editionId: edition.id, fromCache: false };
}

/** للاختبارات / إعادة التحميل اليدوي */
export function clearMushafAyahContentMemory(): void {
  tafsirMemory.clear();
  translationMemory.clear();
}
