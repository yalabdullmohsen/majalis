/**
 * حراسة استخراج اسم الشيخ/المحاضر — يمنع أبواب الفقه وأعداد المجالس من الظهور كـ «شيخ».
 * يُستخدم في البناء والعرض والتحقق دون حذف المحتوى من البذور.
 */

const FIQH_TOPIC_RE =
  /^(الطهارة|الصلاة|الزكاة|الصيام|الصوم|الحج|العمرة|الاعتكاف|الجنائز|البيوع|المعاملات|النكاح|الطلاق|الحدود|الجنايات|القضاء|الرضاع|العدة|اللباس|الأيمان|النذور|الصيد|الأطعمة|الأضحية|العقيقة|علوم\s*القرآن|نواقض\s*الإسلام|ثلاثة\s*الأصول|القواعد\s*الأربع|العقيدة|التوحيد|الفقه|التفسير|الحديث|السيرة|التجويد|النحو|الأصول|القواعد|التزكية|الرقائق|المنهج)(?:\s|$)/u;

const SESSION_COUNT_RE = /^\d+\s*مجلس/u;
const AVAILABILITY_RE = /متاح|24\s*ساعة|ساعة\s*يوميا|أونلاين\s*فقط/u;
const NON_PERSON_RE =
  /^(الدرس|المجلس|الفصل|الجلسة|الباب|الكتاب|الشرح|المسار|المستوى|البرنامج)\b/u;

export function normalizeSpeakerCandidate(raw: string): string {
  return String(raw || "")
    .replace(/^الشيخ(?:ة)?[:：]?\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** هل النص يبدو اسم شخص يصلح للعرض كمحاضر؟ */
export function looksLikePersonSpeaker(raw: string): boolean {
  const name = normalizeSpeakerCandidate(raw);
  if (!name || name.length < 3) return false;
  if (/^\d+$/u.test(name)) return false;
  if (SESSION_COUNT_RE.test(name)) return false;
  if (AVAILABILITY_RE.test(name)) return false;
  if (FIQH_TOPIC_RE.test(name)) return false;
  if (NON_PERSON_RE.test(name)) return false;
  if (/مجلس|درس\s+أول|باب\s+/u.test(name) && !/بن|ابن|بنت/u.test(name)) return false;

  if (/^(د\.|الدكتور|الشيخ|الشيخة|أ\.د\.|الدكتورة)\s/u.test(name)) return true;
  if (/بن|ابن|بنت|آل\s/u.test(name)) return true;

  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;
  return !FIQH_TOPIC_RE.test(tokens[0] || "");
}

/**
 * اختيار محاضر آمن: فضّل المعلّم المصرّح به إن فشل استخراج التسمية.
 */
export function resolveSafeSpeaker(extracted: string, fallbackTeacher: string): string {
  const fromLabel = normalizeSpeakerCandidate(extracted);
  if (looksLikePersonSpeaker(fromLabel)) return fromLabel;
  const fallback = normalizeSpeakerCandidate(fallbackTeacher);
  if (looksLikePersonSpeaker(fallback)) return fallback;
  return "";
}

/** إزالة تكرار مقاطع العنوان المفصولة بشرطة طويلة/قصيرة */
export function dedupeLessonTitleSegments(title: string): string {
  const raw = String(title || "").trim();
  if (!raw) return raw;
  const parts = raw
    .split(/\s*[—–-]\s*/u)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return raw;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const out: string[] = [];
  for (const part of parts) {
    const n = norm(part);
    if (out.some((prev) => norm(prev) === n)) continue;
    out.push(part);
  }
  return out.join(" — ");
}

export function isInvalidKuwaitSpeaker(raw: string): boolean {
  return !looksLikePersonSpeaker(raw);
}
