/**
 * أسماء بديلة لمعرّفات دروس تاريخية (بصمات kuwait-lessons) → kw-* الكانوني.
 * يطابق lib/lesson-id-aliases.mjs — لا تُنشئ دروساً؛ تصحيح رابط فقط.
 */
export const LESSON_ID_ALIASES: Record<string, string> = {
  "kuwait-lessons-403089674f835efd49fed46b561a15fd": "kw-rashed-fundamental-course-0",
  "kuwait-lessons-7b923f5b0be018325687e73a1d9a8bd8": "kw-rashed-fundamental-course-1",
  "kuwait-lessons-a10abf05e354565d45c10468db5e1633": "kw-rashed-fundamental-course-2",
  "kuwait-lessons:403089674f835efd49fed46b561a15fd": "kw-rashed-fundamental-course-0",
  "kuwait-lessons:7b923f5b0be018325687e73a1d9a8bd8": "kw-rashed-fundamental-course-1",
  "kuwait-lessons:a10abf05e354565d45c10468db5e1633": "kw-rashed-fundamental-course-2",
};

export function canonicalizeLessonPublicId(id: string): string {
  const raw = String(id || "").trim();
  if (!raw) return "";
  return LESSON_ID_ALIASES[raw] || raw;
}

/** معرّف بصمة kuwait-lessons بلا اسم بديل معروف — لا يُعرض له رابط تفاصيل. */
export function isOrphanKuwaitLessonHashId(id: string): boolean {
  const raw = String(id || "").trim();
  if (!/^kuwait-lessons[-:][a-f0-9]{32}$/i.test(raw)) return false;
  return !LESSON_ID_ALIASES[raw];
}

/** مرشّحو external_key للبحث — يصلح kuwait-lessons-HASH → kuwait-lessons:HASH. */
export function lessonExternalKeyCandidates(idParam: string): string[] {
  const id = String(idParam || "").trim();
  const out = new Set<string>();
  if (!id) return [];
  out.add(id);
  const canonical = canonicalizeLessonPublicId(id);
  if (canonical) out.add(canonical);
  const hashMatch = id.match(/^(kuwait-lessons)-([a-f0-9]{32})$/i);
  if (hashMatch) out.add(`${hashMatch[1]}:${hashMatch[2]}`);
  out.add(id.replace(/-/g, ":"));
  return [...out];
}
