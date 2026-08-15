/**
 * جلب كسول لتفسير/ترجمة آية واحدة — مرحلة ٢.
 * ترتيب: ذاكرة → جلسة → حزمة offline (IndexedDB) → شبكة → بديل TafseerService.
 */

import {
  getMushafTafsirEdition,
  type MushafTafsirEdition,
} from "@/lib/quran-data/tafsir-editions";
import {
  getMushafTranslationEdition,
  type MushafTranslationEdition,
} from "@/lib/quran-data/translation-editions";
import { QURAN_DATA_FEATURES } from "@/lib/quran-data/flags";

const QURAN_COM = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";
const TAFSIR_SESS_PREFIX = "mj-mushaf-tafsir-sess:";

const tafsirMemory = new Map<string, string>();
const translationMemory = new Map<string, string>();

function verseKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function readTafsirSession(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(TAFSIR_SESS_PREFIX + key);
  } catch {
    return null;
  }
}

function writeTafsirSession(key: string, text: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(TAFSIR_SESS_PREFIX + key, text);
  } catch {
    /* حصة التخزين ممتلئة — الذاكرة كافية لهذه الجلسة */
  }
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
  const sess = readTafsirSession(key);
  if (sess) {
    tafsirMemory.set(key, sess);
    return { text: sess, editionId: edition.id, fromCache: true };
  }

  if (QURAN_DATA_FEATURES.offlineTafsirPacks) {
    try {
      const { readOfflineTafsirAyah } = await import("@/lib/quran-data/offline-tafsir-pack");
      const offline = await readOfflineTafsirAyah(surah, ayah, edition.id);
      if (offline) {
        tafsirMemory.set(key, offline);
        writeTafsirSession(key, offline);
        return { text: offline, editionId: edition.id, fromCache: true };
      }
    } catch {
      /* تابع للشبكة */
    }
  }

  try {
    const url = `${QURAN_COM}/tafsirs/${encodeURIComponent(edition.quranComSlug)}/by_ayah/${surah}:${ayah}`;
    const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Quran.com tafsir: HTTP ${res.status}`);
    const json = (await res.json()) as { tafsir?: { text?: string } };
    const raw = json.tafsir?.text?.trim();
    if (!raw) return null;
    const text = stripTags(raw);
    if (!text) return null;
    tafsirMemory.set(key, text);
    writeTafsirSession(key, text);
    if (QURAN_DATA_FEATURES.offlineTafsirPacks) {
      void import("@/lib/quran-data/offline-tafsir-pack").then(({ writeOfflineTafsirAyah }) =>
        writeOfflineTafsirAyah(surah, ayah, edition.id, text),
      );
    }
    return { text, editionId: edition.id, fromCache: false };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    /* بديل محلي (IndexedDB / ذاكرة TafseerService) عند فشل الشبكة */
    try {
      const { TafseerService } = await import("@/core/tafseer/TafseerService");
      const local = await TafseerService.getInstance().getAyahTafsir(surah, ayah, "ar.muyassar");
      if (local?.text?.trim()) {
        const text = stripTags(local.text);
        tafsirMemory.set(key, text);
        writeTafsirSession(key, text);
        return { text, editionId: edition.id, fromCache: true };
      }
    } catch {
      /* تجاهل — نُعيد رمي خطأ الجلب الأصلي */
    }
    throw err;
  }
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
