/**
 * مناطق عرض المحتوى الشرعي — يمنع الضعيف/غير الثابت من الواجهة العامة.
 */

export type DisplayZone =
  | "home"
  | "topTicker"
  | "dailyReminder"
  | "pushNotification"
  | "featuredCard"
  | "hadithWeakPage"
  | "editorialWarning"
  | "educationalContext";

export const PUBLIC_DISPLAY_ZONES: DisplayZone[] = [
  "home",
  "topTicker",
  "dailyReminder",
  "pushNotification",
  "featuredCard",
];

export type ScholarlyContentRecord = {
  text: string;
  source?: string;
  reference?: string;
  grade?: string;
  gradeSource?: string;
  displayZones?: DisplayZone[];
  reviewed?: boolean;
  needsSource?: boolean;
  notes?: string;
};

const WEAK_GRADE = /^(ضعيف|موضوع|مردود|منكر|واه|لا\s*يصح)/;
const WEAK_SOURCE =
  /الدرجة في حقل الحكم|لم\s*يثبت|ضعّفه|ضعفه|منكر\s*الحديث|إسناد(?:ه)?\s*لا\s*يصح|لا\s*يُتعبد|لا\s*يُتعبَّ?د|لا\s*يُستقل/i;

/** عبارات ممنوعة في HTML العام (بوابة CI). */
export const PUBLIC_WEAK_PHRASES = [
  "ضعيف",
  "ضعّفه",
  "ضعفه",
  "موضوع",
  "لا يصح",
  "لم يثبت",
  "منكر الحديث",
  "الدرجة في حقل الحكم",
  "حديث تنبيه الحديث",
] as const;

export function isWeakGrade(grade?: string): boolean {
  const g = (grade || "").trim();
  if (!g) return false;
  return WEAK_GRADE.test(g) || /ضعيف|موضوع|منكر|واه|لا\s*يصح/.test(g);
}

export function hasWeakSourceMarker(source?: string): boolean {
  if (!source?.trim()) return false;
  return WEAK_SOURCE.test(source);
}

/** هل يُمنع هذا المحتوى من مناطق العرض العامة؟ */
export function isBlockedFromPublic(record: Pick<ScholarlyContentRecord, "text" | "source" | "grade">): boolean {
  if (isWeakGrade(record.grade)) return true;
  if (hasWeakSourceMarker(record.source)) return true;
  const zones = record as ScholarlyContentRecord;
  if (zones.displayZones?.length) {
    const allowsPublic = PUBLIC_DISPLAY_ZONES.some((z) => zones.displayZones!.includes(z));
    if (!allowsPublic) return true;
  }
  return false;
}

/** يمنع عرض محتوى بلا مصدر في المناطق العامة. */
export function isUnsourcedForPublic(record: {
  source?: string;
  reference?: string;
  needsSource?: boolean;
}): boolean {
  if (record.needsSource) return true;
  const src = (record.source || record.reference || "").trim();
  if (!src) return true;
  if (/^السنة\s*النبوية$/i.test(src) && !record.reference?.trim()) return true;
  return false;
}

export function isAllowedInZone(
  record: Pick<ScholarlyContentRecord, "text" | "source" | "grade" | "displayZones" | "reference"> & {
    needsSource?: boolean;
  },
  zone: DisplayZone,
): boolean {
  if (record.displayZones?.length && !record.displayZones.includes(zone)) return false;
  if (PUBLIC_DISPLAY_ZONES.includes(zone) && isUnsourcedForPublic(record)) return false;
  if (PUBLIC_DISPLAY_ZONES.includes(zone) && isBlockedFromPublic(record)) return false;
  return true;
}

export function filterForPublicZone<T extends Pick<ScholarlyContentRecord, "text" | "source" | "grade">>(
  items: T[],
  zone: DisplayZone = "topTicker",
): T[] {
  return items.filter((item) => isAllowedInZone(item, zone));
}

/** صياغة حكم واضحة للمستخدم — بلا عبارات تقنية. */
export function formatPublicGrade(grade?: string): string | undefined {
  const g = (grade || "").trim();
  if (!g) return undefined;
  if (/^صحيح/i.test(g)) return "الحكم: صحيح";
  if (/^حسن/i.test(g)) return "الحكم: حسن";
  if (/^متفق/i.test(g)) return "الحكم: صحيح — متفق عليه";
  if (/ضعيف/.test(g)) return "الحكم: ضعيف — للتنبيه لا للعمل";
  if (/موضوع/.test(g)) return "الحكم: موضوع — للتنبيه لا للعمل";
  if (/لم\s*يثبت/i.test(g)) return "لم يثبت مرفوعًا إلى النبي ﷺ";
  return `الحكم: ${g}`;
}

/** تنظيف عبارة المصدر للعرض العام. */
export function normalizePublicSource(source?: string, grade?: string): string | undefined {
  if (!source?.trim()) return undefined;
  const s = source
    .replace(/ — الدرجة في حقل الحكم[^.]*$/u, "")
    .replace(/الدرجة في حقل الحكم[^.]*$/u, "")
    .trim();
  if (/لم\s*يثبت/i.test(s) && !/^صحيح|^حسن|^متفق/i.test(grade || "")) {
    return "لم يثبت مرفوعًا إلى النبي ﷺ — للتنبيه لا للعمل";
  }
  const publicGrade = formatPublicGrade(grade);
  if (publicGrade && !/الحكم:/.test(s)) {
    return `${s} — ${publicGrade}`;
  }
  return s || undefined;
}

export const WEAK_HADITH_EDUCATIONAL_DISCLAIMER =
  "لا يُحتج بالحديث الضعيف في العقائد والأحكام، ولا يُنسب إلى النبي ﷺ إلا مع بيان حكمه.";

/** يختصر النص في الشريط العلوي — التفاصيل الكاملة في صفحة الوجهة. */
export function truncateForPublicPreview(text: string, maxLen = 72): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

const WEAK_PHRASE_RE = new RegExp(
  PUBLIC_WEAK_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

/** هل يحتوي النص على عبارة ممنوعة في الواجهة العامة؟ */
export function containsPublicWeakPhrase(text?: string): boolean {
  if (!text?.trim()) return false;
  return WEAK_PHRASE_RE.test(text);
}
