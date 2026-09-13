import { getSurahMeta } from "@/lib/quran-api";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import { pageFirstAyahMushaf1 } from "@/lib/quran-data/ayah-page-index.generated";
import type {
  QuranAyahReference,
  QuranNavigationSource,
  QuranHighlightMode,
  ValidatedQuranAyahReference,
} from "./types";

function parsePacked(key: string): { surah: number; ayah: number } | null {
  const [s, a] = key.split(":").map(Number);
  if (!Number.isFinite(s) || !Number.isFinite(a) || s! < 1 || a! < 1) return null;
  return { surah: s!, ayah: a! };
}

/** هل الآية تقع فعلًا على الصفحة (بين أول آية للصفحة وأول آية للصفحة التالية)؟ */
export function ayahBelongsToPage(surahId: number, ayahId: number, pageNumber: number): boolean {
  if (pageNumber < 1 || pageNumber > 604) return false;
  const start = parsePacked(pageFirstAyahMushaf1(pageNumber));
  if (!start) return false;
  const next =
    pageNumber < 604 ? parsePacked(pageFirstAyahMushaf1(pageNumber + 1)) : { surah: 115, ayah: 1 };
  if (!next) return false;
  const afterStart =
    surahId > start.surah || (surahId === start.surah && ayahId >= start.ayah);
  const beforeNext =
    surahId < next.surah || (surahId === next.surah && ayahId < next.ayah);
  return afterStart && beforeNext;
}

export function validateAyahIds(surahId: number, ayahId: number): string | null {
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    return "رقم السورة خارج النطاق (1–114)";
  }
  if (!Number.isInteger(ayahId) || ayahId < 1) {
    return "رقم الآية غير صالح";
  }
  const meta = getSurahMeta(surahId);
  const max = meta?.ayahs ?? 0;
  if (ayahId > max) {
    return `الآية ${ayahId} غير موجودة في السورة ${surahId} (أقصى ${max})`;
  }
  return null;
}

export type BuildReferenceInput = {
  surahId: number;
  ayahId: number;
  navigationSource: QuranNavigationSource;
  sourceSectionId?: string;
  sourceContentId?: string;
  sourceRoute?: string;
  highlightMode?: QuranHighlightMode;
  /** للاختبار فقط — يُرفض إن لم يطابق الـmapping */
  pageNumberOverride?: number;
};

/**
 * يبني مرجعًا موثّقًا: الصفحة من findMushafPageForAyah فقط، مع التحقق من الانتماء.
 */
export function buildQuranAyahReference(input: BuildReferenceInput): ValidatedQuranAyahReference {
  const idError = validateAyahIds(input.surahId, input.ayahId);
  if (idError) return { ok: false, error: idError };

  const mapped = findMushafPageForAyah(input.surahId, input.ayahId);
  if (input.pageNumberOverride != null && input.pageNumberOverride !== mapped) {
    return {
      ok: false,
      error: `تعارض صفحة: المطلوب ${input.pageNumberOverride} والمرجع المعتمد ${mapped}`,
    };
  }
  if (!ayahBelongsToPage(input.surahId, input.ayahId, mapped)) {
    return {
      ok: false,
      error: `الآية ${input.surahId}:${input.ayahId} لا تنتمي للصفحة ${mapped}`,
    };
  }

  const ref: QuranAyahReference = {
    surahId: input.surahId,
    ayahId: input.ayahId,
    pageNumber: mapped,
    sourceSectionId: input.sourceSectionId,
    sourceContentId: input.sourceContentId,
    sourceRoute: input.sourceRoute,
    navigationSource: input.navigationSource,
    highlightMode: input.highlightMode ?? "navigation",
    requestedAt: Date.now(),
  };
  return { ok: true, ref };
}
