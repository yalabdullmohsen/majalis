import { normalizeArabic } from "@/lib/arabic-search";
import { toWesternDigits } from "@/shared/arabic-normalize";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

/** تطبيع نص عربي للمقارنة — بلا تشكيل، أ/إ/آ→ا، ى→ي، ة→ه */
export function normalizeLessonText(value: string | null | undefined): string {
  const raw = toWesternDigits(String(value ?? "").trim());
  return normalizeArabic(raw).replace(/\s+/g, " ").trim();
}

/** مفتاح مقارنة مضغوط بلا مسافات */
export function normalizeLessonKey(value: string | null | undefined): string {
  return normalizeLessonText(value).replace(/\s+/g, "");
}

/** استخراج اسم الدورة الأساسي من عنوان الجلسة */
export function extractCourseBaseTitle(title: string): string {
  const raw = String(title || "").trim();
  if (!raw.includes(" — ")) return raw;
  const parts = raw.split(" — ").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return raw;
  const head = parts[0] || raw;
  if (/^(دورة|برنامج|ملتقى|مجلس)/u.test(head)) return head;
  return parts.slice(0, -1).join(" — ").trim() || raw;
}

export function normalizeLessonTitle(title: string): string {
  return normalizeLessonKey(title);
}

export function normalizeLessonSheikh(name: string): string {
  return normalizeLessonKey(name.replace(/^الشيخ(?:ة)?:\s*/u, ""));
}

export function normalizeLessonPlace(lesson: Pick<KuwaitLessonRecord, "mosque" | "region" | "governorate">): string {
  return normalizeLessonKey([lesson.mosque, lesson.region, lesson.governorate].filter(Boolean).join(" "));
}

export function normalizeLessonDay(day: string): string {
  return normalizeLessonKey(day);
}

export function normalizeLessonTime(time: string): string {
  return normalizeLessonKey(time);
}

export function normalizeLessonSource(source: KuwaitLessonRecord["source"]): string {
  return source || "unknown";
}

const ONLINE_VENUE_RE = /(?:^|[\s،,.])(?:ا?لكتروني|أونلاين|اونلاين|online|عن\s*بعد)(?:[\s،,.]|$)/iu;

export function isOnlineVenue(mosque?: string, region?: string): boolean {
  const hay = normalizeLessonText([mosque, region].filter(Boolean).join(" "));
  return ONLINE_VENUE_RE.test(hay) || hay === "منصه" || hay.includes("منصه ");
}

export function getLessonDeliveryMode(
  lesson: Pick<KuwaitLessonRecord, "mosque" | "region" | "hasLiveStream" | "streamUrl">,
): "حضوري" | "عن بعد" | "حضوري وعن بعد" | null {
  const online = isOnlineVenue(lesson.mosque, lesson.region) || Boolean(lesson.streamUrl);
  const inPerson = Boolean(lesson.mosque?.trim()) && !isOnlineVenue(lesson.mosque, lesson.region);
  const remote = online || Boolean(lesson.hasLiveStream);

  if (inPerson && remote) return "حضوري وعن بعد";
  if (remote && !inPerson) return "عن بعد";
  if (inPerson) return "حضوري";
  if (remote) return "عن بعد";
  return null;
}
