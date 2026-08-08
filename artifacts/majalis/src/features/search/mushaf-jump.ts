/**
 * تحليل استعلام انتقال المصحف — يعتمد التطبيع المشترك فقط.
 * أمثلة: «283» / «٢٨٣» / «2:255» / «٢:٢٥٥» / «البقرة» / «بقرة» / «al-baqarah» / «البقرة 255»
 */
import { normalizeArabic, toWesternDigits } from "@/shared/arabic-normalize";
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

function matchSurahNumber(rawName: string): number | null {
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

  // مطابقة اسم عربي مطبّع (كامل أو بلا «ال»)
  for (let i = 1; i <= 114; i++) {
    const name = normalizeArabic(getSurahMeta(i).name);
    if (!name) continue;
    if (name === needle) return i;
    if (name.replace(/^ال/, "") === needle.replace(/^ال/, "")) return i;
    if (name.includes(needle) && needle.length >= 2) return i;
    if (needle.includes(name) && name.length >= 2) return i;
  }
  return null;
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
