/**
 * تحليل استعلام انتقال المصحف — يعتمد التطبيع المشترك فقط.
 * أمثلة: «283» / «٢٨٣» / «2:255» / «٢:٢٥٥» / «البقرة» / «بقرة» / «al-baqarah» / «البقرة 255»
 */
import { normalizeArabic, toWesternDigits } from "@/shared/arabic-normalize";
import {
  scoreTolerantMatch,
  stripDefiniteArticle,
} from "@/features/search/tolerant-match";
import { SURAH_START_PAGES, getSurahMeta } from "@/lib/quran-api";

export type MushafJumpTarget =
  | { kind: "page"; page: number }
  | { kind: "ayah"; surah: number; ayah: number; pageHint: number };

/** أسماء إنجليزية شائعة → رقم السورة (تنقّل فقط، ليست محتوىً شرعيًا) */
const SURAH_EN_ALIASES: Record<string, number> = {
  fatiha: 1,
  alfatiha: 1,
  "al-fatiha": 1,
  "al-fatihah": 1,
  baqara: 2,
  baqarah: 2,
  albaqara: 2,
  albaqarah: 2,
  "al-baqara": 2,
  "al-baqarah": 2,
  "ali-imran": 3,
  alimran: 3,
  "al-imran": 3,
  nisa: 4,
  annisa: 4,
  "an-nisa": 4,
  maidah: 5,
  almaidah: 5,
  "al-maidah": 5,
  kahf: 18,
  alkahf: 18,
  "al-kahf": 18,
  yasin: 36,
  yaaseen: 36,
  "ya-sin": 36,
  mulk: 67,
  almulk: 67,
  "al-mulk": 67,
  ikhlas: 112,
  alikhlas: 112,
  "al-ikhlas": 112,
  falaq: 113,
  alfalaq: 113,
  "al-falaq": 113,
  nas: 114,
  annas: 114,
  "an-nas": 114,
};

function stripSurahPrefix(s: string): string {
  return s.replace(/^(?:سورة|سوره)\s+/u, "").trim();
}

/** يطابق رقم سورة من اسم/رقم/اسم إنجليزي مع تطبيع متسامح. */
export function matchSurahNumber(rawName: string): number | null {
  const cleaned = stripSurahPrefix(rawName);
  if (!cleaned) return null;

  const western = toWesternDigits(cleaned).trim();
  if (/^\d{1,3}$/.test(western)) {
    const n = Number(western);
    if (n >= 1 && n <= 114) return n;
  }

  const enKey = western
    .toLowerCase()
    .replace(/[''`ʾʿ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (enKey && SURAH_EN_ALIASES[enKey]) return SURAH_EN_ALIASES[enKey]!;

  const needle = normalizeArabic(cleaned);
  if (!needle) return null;

  // مطابقة اسم عربي مطبّع مع تسامح (بادئة/جزئي/تحرير) + «ال» اختيارية
  let best: { n: number; rank: number; distance: number; nameLen: number } | null = null;
  for (let i = 1; i <= 114; i++) {
    const rawName = getSurahMeta(i).name;
    const name = normalizeArabic(rawName);
    if (!name) continue;
    const m = scoreTolerantMatch(rawName, cleaned, name);
    if (!m) continue;
    // رفض تطابقات substring قصيرة جداً على أسماء قصيرة (ضوضاء)
    if (m.kind === "substring" && stripDefiniteArticle(needle).length < 3) continue;
    const cand = { n: i, rank: m.rank, distance: m.distance, nameLen: name.length };
    if (
      !best ||
      cand.rank < best.rank ||
      (cand.rank === best.rank && cand.distance < best.distance) ||
      (cand.rank === best.rank && cand.distance === best.distance && cand.nameLen < best.nameLen)
    ) {
      best = cand;
    }
  }
  return best?.n ?? null;
}

/**
 * يحلّل استعلام انتقال في المصحف بعد تطبيع الأرقام والحروف.
 */
export function parseMushafJumpQuery(raw: string): MushafJumpTarget | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const western = toWesternDigits(trimmed).trim();

  // صفحة فقط: 283 / ٢٨٣
  if (/^\d{1,3}$/.test(western)) {
    const page = Number(western);
    if (page >= 1 && page <= 604) return { kind: "page", page };
    return null;
  }

  // سورة:آية — 2:255 / ٢:٢٥٥
  const colon = western.match(/^(\d{1,3})\s*[:：]\s*(\d{1,3})$/);
  if (colon) {
    const surah = Number(colon[1]);
    const ayah = Number(colon[2]);
    if (surah >= 1 && surah <= 114 && ayah >= 1) {
      const meta = getSurahMeta(surah);
      if (ayah <= meta.ayahs) {
        return {
          kind: "ayah",
          surah,
          ayah,
          pageHint: SURAH_START_PAGES[surah - 1] ?? 1,
        };
      }
    }
    return null;
  }

  // اسم سورة + آية اختيارية: البقرة 255 / البقرة ٢٥٥ / al-baqarah 255
  const nameAyah = western.match(/^(.+?)\s+(\d{1,3})$/u);
  if (nameAyah) {
    const surah = matchSurahNumber(nameAyah[1] ?? "");
    const ayah = Number(nameAyah[2]);
    if (surah && ayah >= 1) {
      const meta = getSurahMeta(surah);
      if (ayah <= meta.ayahs) {
        return {
          kind: "ayah",
          surah,
          ayah,
          pageHint: SURAH_START_PAGES[surah - 1] ?? 1,
        };
      }
    }
  }

  // اسم سورة فقط → أول صفحة السورة
  const surahOnly = matchSurahNumber(western);
  if (surahOnly) {
    return { kind: "page", page: SURAH_START_PAGES[surahOnly - 1] ?? 1 };
  }

  return null;
}
