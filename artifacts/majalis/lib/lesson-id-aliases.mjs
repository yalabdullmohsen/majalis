/**
 * أسماء بديلة لمعرّفات دروس تاريخية (بصمات kuwait-lessons:sha)
 * تُقابِل السجلات الكانونية في البذرة kw-*.
 * لا تُنشئ دروساً جديدة — إعادة توجيه للمعرّف الصحيح فقط.
 */
export const LESSON_ID_ALIASES = {
  "kuwait-lessons-403089674f835efd49fed46b561a15fd": "kw-rashed-fundamental-course-0",
  "kuwait-lessons-7b923f5b0be018325687e73a1d9a8bd8": "kw-rashed-fundamental-course-1",
  "kuwait-lessons-a10abf05e354565d45c10468db5e1633": "kw-rashed-fundamental-course-2",
  // صيغة التخزين بـ ":"
  "kuwait-lessons:403089674f835efd49fed46b561a15fd": "kw-rashed-fundamental-course-0",
  "kuwait-lessons:7b923f5b0be018325687e73a1d9a8bd8": "kw-rashed-fundamental-course-1",
  "kuwait-lessons:a10abf05e354565d45c10468db5e1633": "kw-rashed-fundamental-course-2",
};

/** يعيد المعرّف الكانوني للرابط العام. */
export function canonicalizeLessonPublicId(id) {
  const raw = String(id || "").trim();
  if (!raw) return "";
  return LESSON_ID_ALIASES[raw] || raw;
}

/**
 * مرشّحو external_key للبحث في Supabase.
 * يصلح kuwait-lessons-HASH → kuwait-lessons:HASH دون استبدال كل الشرطات.
 */
export function lessonExternalKeyCandidates(idParam) {
  const id = String(idParam || "").trim();
  const out = new Set();
  if (!id) return [];
  out.add(id);
  const canonical = canonicalizeLessonPublicId(id);
  if (canonical) out.add(canonical);

  const hashMatch = id.match(/^(kuwait-lessons)-([a-f0-9]{32})$/i);
  if (hashMatch) {
    out.add(`${hashMatch[1]}:${hashMatch[2]}`);
  }
  // توافق خلفي لصيغ نادرة خزّنت بشرطة سفلية أو نقطتين خاطئتين
  out.add(id.replace(/-/g, ":"));
  return [...out];
}
