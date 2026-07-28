/**
 * Web port of the RN QuranReader reciter sketch:
 *
 * ```
 * const reciters = {
 *   mishary: { name: "مشاري العفاسي", baseUrl: "…" },
 *   maher:   { name: "ماهر المعيقلي", baseUrl: "…" },
 * };
 * const [selectedReciter, setSelectedReciter] = useState("mishary");
 * const getAudioUrl = (verseNumber) =>
 *   `${reciters[selectedReciter].baseUrl}${verseNumber}.mp3`;
 * ```
 *
 * Backed by the real everyayah.com catalog in `quran-audio.ts`
 * (`alafasy` ≈ RN `mishary`; `maher` matches).
 */

import { useCallback, useState } from "react";
import {
  RECITERS,
  getReciter,
  loadReciterId,
  saveReciterId,
  type QuranReciter,
} from "@/lib/quran-audio";

export type ReciterCatalogEntry = {
  /** Arabic display name (RN `name`). */
  name: string;
  /** everyayah folder URL with trailing slash (RN `baseUrl`). */
  baseUrl: string;
};

const EVERYAYAH_ORIGIN = "https://everyayah.com/data";

function folderBaseUrl(folder: string): string {
  return `${EVERYAYAH_ORIGIN}/${folder}/`;
}

function toCatalogEntry(r: QuranReciter): ReciterCatalogEntry {
  return {
    name: r.nameAr,
    baseUrl: folderBaseUrl(r.everyayahFolder),
  };
}

/**
 * 1. قائمة القراء (ملف ثابت) — مفاتيح = معرف القارئ.
 * يشمل الاسم العربي و`baseUrl` لكل قارئ من كتالوج everyayah.
 */
export const reciters: Record<string, ReciterCatalogEntry> = Object.fromEntries(
  RECITERS.map((r) => [r.id, toCatalogEntry(r)]),
);

/** RN sketch alias — `mishary` → مشاري (alafasy). */
reciters.mishary = reciters.alafasy!;

/** الافتراضي في الرسم: mishary → نستخدم معرف المنصة `alafasy`. */
export const DEFAULT_SELECTED_RECITER = "alafasy";

/** تطبيع المعرفات الشائعة من رسم RN إلى معرفات المنصة. */
export function resolveReciterId(id: string): string {
  if (id === "mishary" || id === "afasy") return "alafasy";
  if (id === "muaiqly") return "maher";
  return getReciter(id).id;
}

export function getReciterCatalogEntry(id: string): ReciterCatalogEntry {
  const resolved = resolveReciterId(id);
  return reciters[resolved] ?? reciters[DEFAULT_SELECTED_RECITER]!;
}

/** SSSAAA stem for everyayah filenames (e.g. 2:255 → "002255"). */
export function verseFileStem(surah: number, ayah: number): string {
  return `${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}`;
}

/**
 * 3. دالة الحصول على رابط الآية بناءً على القارئ المختار.
 * `verseNumber` = جذع الملف SSSAAA (نص أو رقم يُصفَّر إلى 6 خانات).
 */
export function getAudioUrl(
  verseNumber: string | number,
  selectedReciter: string = DEFAULT_SELECTED_RECITER,
): string {
  const entry = getReciterCatalogEntry(selectedReciter);
  const stem =
    typeof verseNumber === "number"
      ? String(verseNumber).padStart(6, "0")
      : String(verseNumber).padStart(6, "0");
  return `${entry.baseUrl}${stem}.mp3`;
}

/** مريحة: سورة + آية → نفس رابط everyayah. */
export function getAudioUrlForAyah(
  surah: number,
  ayah: number,
  selectedReciter: string = DEFAULT_SELECTED_RECITER,
): string {
  return getAudioUrl(verseFileStem(surah, ayah), selectedReciter);
}

/**
 * 2. الحالة داخل المكون — `selectedReciter` مع إبقاء التفضيل في localStorage.
 * عند الربط بمحرّك المصحف مرِّر `onChange` لـ `setReciter`.
 */
export function useSelectedReciter(onChange?: (id: string) => void): {
  selectedReciter: string;
  setSelectedReciter: (id: string) => void;
  reciters: typeof reciters;
  getAudioUrl: (verseNumber: string | number) => string;
  getAudioUrlForAyah: (surah: number, ayah: number) => string;
} {
  const [selectedReciter, setSelectedReciterState] = useState(() =>
    resolveReciterId(loadReciterId()),
  );

  const setSelectedReciter = useCallback(
    (id: string) => {
      const resolved = resolveReciterId(id);
      setSelectedReciterState(resolved);
      saveReciterId(resolved);
      onChange?.(resolved);
    },
    [onChange],
  );

  const getUrl = useCallback(
    (verseNumber: string | number) => getAudioUrl(verseNumber, selectedReciter),
    [selectedReciter],
  );

  const getUrlForAyah = useCallback(
    (surah: number, ayah: number) => getAudioUrlForAyah(surah, ayah, selectedReciter),
    [selectedReciter],
  );

  return {
    selectedReciter,
    setSelectedReciter,
    reciters,
    getAudioUrl: getUrl,
    getAudioUrlForAyah: getUrlForAyah,
  };
}
