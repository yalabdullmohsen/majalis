/**
 * «الأمم السابقة» — مصدر البيانات المركزي الوحيد للقسم.
 *
 * كل ما يُعرض عن الأمم (البطاقات، القصة الكاملة، المختصر، الفلاتر، البحث،
 * أسئلة المسابقة، وبيانات SEO) يُشتقّ من هنا؛ فلا تُنسخ قصةٌ إلى ملف آخر.
 * أضف أمةً جديدة بإنشاء ملفها تحت `nations/data/` وتسجيلها في `NATIONS`.
 */
import { arabicMatchAny } from "@/lib/arabic-search";
import type { Nation, PunishmentType } from "./nations/types";
import { QAWM_NUH } from "./nations/data/nuh";
import { AAD, THAMUD } from "./nations/data/aad-thamud";
import { QAWM_IBRAHIM, QAWM_LUT, MADYAN } from "./nations/data/ibrahim-lut-madyan";
import { QAWM_FIRAUN, BANI_ISRAIL } from "./nations/data/firaun-bani-israil";
import {
  ASHAB_SABT,
  ASHAB_QARYA,
  ASHAB_RASS,
  QAWM_TUBBA,
  SABA,
  ASHAB_JANNA,
  ASHAB_FIL,
  YAJUJ_MAJUJ,
  QURUN_MUJMALA,
} from "./nations/data/others";

export type { Nation, NationChapter, Evidence, EvidenceKind, PunishmentType } from "./nations/types";

/** مرتّبة على التسلسل التقريبي، ثم ما لا يُعرف موضعه الزمني. */
export const NATIONS: Nation[] = [
  QAWM_NUH,
  AAD,
  THAMUD,
  QAWM_IBRAHIM,
  QAWM_LUT,
  MADYAN,
  QAWM_FIRAUN,
  BANI_ISRAIL,
  ASHAB_SABT,
  SABA,
  ASHAB_FIL,
  ASHAB_QARYA,
  ASHAB_RASS,
  QAWM_TUBBA,
  ASHAB_JANNA,
  YAJUJ_MAJUJ,
  QURUN_MUJMALA,
];

export function getNation(slug: string): Nation | undefined {
  return NATIONS.find((n) => n.slug === slug);
}

/** القوم السابق والتالي بترتيب العرض — لأزرار التنقل في صفحة التفاصيل. */
export function getNationNeighbors(slug: string): { prev?: Nation; next?: Nation } {
  const i = NATIONS.findIndex((n) => n.slug === slug);
  if (i < 0) return {};
  return { prev: NATIONS[i - 1], next: NATIONS[i + 1] };
}

/** بحث فوري بالاسم والمرادفات والنبي ونوع العذاب. */
export function searchNations(query: string): Nation[] {
  const q = query.trim();
  if (!q) return NATIONS;
  return NATIONS.filter((n) =>
    arabicMatchAny(
      [n.name, ...n.aliases, n.prophet?.name ?? "", n.punishment.type, n.place, n.sin, ...n.tags],
      q,
    ),
  );
}

export type NationFilters = {
  prophet?: string;
  punishment?: PunishmentType | "الكل";
  /** «آمنوا» | «كذّبوا» | «الكل» */
  stance?: "believed" | "rejected" | "all";
  /** وسم من tags — مثل «بنو إسرائيل» أو «بلا نبي مسمّى». */
  tag?: string;
  search?: string;
};

export function filterNations(filters: NationFilters = {}): Nation[] {
  let list = filters.search ? searchNations(filters.search) : NATIONS;
  if (filters.prophet && filters.prophet !== "الكل") {
    list = list.filter((n) => n.prophet?.name === filters.prophet);
  }
  if (filters.punishment && filters.punishment !== "الكل") {
    list = list.filter((n) => n.punishment.type === filters.punishment);
  }
  if (filters.stance === "believed") list = list.filter((n) => n.believed);
  if (filters.stance === "rejected") list = list.filter((n) => !n.believed);
  if (filters.tag && filters.tag !== "الكل") {
    list = list.filter((n) => n.tags.includes(filters.tag!));
  }
  return list;
}

/** خيارات الفلاتر مشتقّة من البيانات نفسها — لا قوائم مكتوبة يدوياً تتقادم. */
export function getNationFilterOptions() {
  const prophets = Array.from(
    new Set(NATIONS.filter((n) => n.prophetKnown && n.prophet).map((n) => n.prophet!.name)),
  );
  const punishments = Array.from(new Set(NATIONS.map((n) => n.punishment.type)));
  const tags = Array.from(new Set(NATIONS.flatMap((n) => n.tags))).sort((a, b) =>
    a.localeCompare(b, "ar"),
  );
  return { prophets, punishments, tags };
}

/** الأمم مرتّبةً زمنياً تقريبياً؛ ما لا يُعرف موضعه يُذيَّل بوسم صريح. */
export function getNationsTimeline(): { dated: Nation[]; undated: Nation[] } {
  const dated = NATIONS.filter((n) => n.eraOrder != null).sort(
    (a, b) => (a.eraOrder as number) - (b.eraOrder as number),
  );
  const undated = NATIONS.filter((n) => n.eraOrder == null);
  return { dated, undated };
}

/** تقدير مدة القراءة بالدقائق — 180 كلمة/دقيقة للعربية. */
export function estimateReadingMinutes(nation: Nation): number {
  const words = nation.chapters
    .flatMap((c) => [c.title, ...c.body, ...(c.evidences?.map((e) => e.text) ?? [])])
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

/** كل الآيات المرتبطة بأمة — تُستعمل في الربط مع القرآن والتفسير. */
export function getNationAyahRefs(nation: Nation) {
  return nation.quranRefs.map((r) => ({ ...r, label: `${r.surah}: ${r.ayahs}` }));
}
