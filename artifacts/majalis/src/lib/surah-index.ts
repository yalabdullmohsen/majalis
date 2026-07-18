/**
 * فهرس السور — بيانات محلية موثوقة أولًا (المرحلة 9، 2026-07-18).
 *
 * رقم/اسم/عدد الآيات تُقرَأ من public/data/quran/manifest.json — نفس الملف
 * المحلي المُتحقَّق من سلامته حرفيًا عبر sha256 في scripts/verify-quran-
 * integrity.mjs (يُشغَّل ضمن pnpm run test:regression)، فهذه القيم مضمونة
 * الدقة بلا اعتماد على شبكة. تصنيف مكية/مدنية فقط يُجلَب من AlQuran Cloud
 * الحي (نفس مصدر fetchSurahList في src/lib/quran-api.ts) كتحسين تدريجي —
 * إن تعذّر الاتصال تبقى القائمة كاملة وصحيحة، فقط بلا فلتر مكية/مدنية،
 * بدل تعليق الصفحة على شبكة قد لا تتوفر.
 */
import { fetchSurahList } from "@/lib/quran-api";

export type SurahIndexEntry = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan" | null;
};

type ManifestSurah = { number: number; name: string; englishName: string; numberOfAyahs: number };
type Manifest = { surahs: ManifestSurah[] };

/** القائمة الأساسية — محلية دومًا، لا تفشل أبدًا بسبب الشبكة. */
export async function fetchSurahIndexLocal(): Promise<SurahIndexEntry[]> {
  const res = await fetch("/data/quran/manifest.json", { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`manifest fetch failed: HTTP ${res.status}`);
  const manifest = (await res.json()) as Manifest;
  return manifest.surahs
    .map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: null,
    }))
    .sort((a, b) => a.number - b.number);
}

/** تصنيف مكية/مدنية — تحسين تدريجي حي، يُعاد null بصمت عند فشل الشبكة. */
export async function fetchRevelationTypes(): Promise<Map<number, "Meccan" | "Medinan">> {
  try {
    const list = await fetchSurahList();
    return new Map(list.map((s) => [s.number, s.revelationType]));
  } catch {
    return new Map();
  }
}

const FAVORITES_KEY = "majalis-surah-favorites-v1";

export function readFavoriteSurahs(): Set<number> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

export function toggleFavoriteSurah(number: number): Set<number> {
  const current = readFavoriteSurahs();
  if (current.has(number)) current.delete(number);
  else current.add(number);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...current]));
  } catch {
    /* localStorage غير متاح — تجاهل بأمان، المفضلة تكميلية */
  }
  return current;
}
