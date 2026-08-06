const HONORIFIC_PREFIX =
  /^(?:فضيلة|معالي|سمو|صاحب|العلامة|الشيخ(?:ة)?(?:\s+الدكتور(?:ة)?|\s+د\.?)?|الدكتور(?:ة)?|د\.|Dr\.?)\s+/iu;

const DEGREE_PREFIX = /^(?:د\.|Dr\.)\s*/iu;

/** لقب مُسبَق بصيغة «الشيخ:» أو «الشيخة:» أو مكرّر بلا اسم */
const LABEL_PREFIX = /^(?:الشيخة?|الدكتور(?:ة)?|الأستاذ(?:ة)?|القارئ)\s*[:：]\s*/iu;
const BARE_TITLES = new Set(["الشيخ", "الشيخة", "الدكتور", "الدكتورة", "الأستاذ", "الأستاذة", "القارئ", "د."]);

const FEMALE_FIRST_NAMES = new Set([
  "فاطمة", "عائشة", "مريم", "أميرة", "نور", "سارة", "هند", "رقية",
  "خديجة", "زينب", "حفصة", "سمية", "ريم", "دلال", "ابتسام", "أسماء",
  "لطيفة", "شيخة", "موزة", "نورة", "منيرة", "بدرية", "جواهر", "سلمى",
  "مها", "وفاء", "هيفاء", "إيمان", "آمنة", "أروى", "رنا", "لمياء",
  "سعاد", "نجود", "رشا", "هبة", "ملاك", "عزيزة", "لولوة", "مضاوي",
  "ميرة", "مشاعل", "جوخة", "مريم", "حصة", "أمينة", "رحمة",
]);

/** Strip honorifics and return the core name only. */
export function stripSheikhHonorifics(name: string): string {
  let value = String(name || "").trim();
  if (!value) return "";

  // أزل «الشيخ:» إن وُجدت مسبقًا حتى لا تُضاعَف لاحقًا
  value = value.replace(LABEL_PREFIX, "").trim();

  for (let i = 0; i < 4; i += 1) {
    const next = value.replace(HONORIFIC_PREFIX, "").replace(DEGREE_PREFIX, "").trim();
    if (next === value) break;
    value = next;
  }

  value = value.replace(/\s+/g, " ").trim();
  if (BARE_TITLES.has(value)) return "";
  return value;
}

/** هل الاسم مؤنث؟ (يحمل "الشيخة" أو اسم أول نسائي) */
export function isFemaleName(name: string): boolean {
  const raw = String(name || "").trim();
  if (/الشيخة/u.test(raw)) return true;
  const core = stripSheikhHonorifics(raw);
  const first = core.split(/\s+/)[0] ?? "";
  return FEMALE_FIRST_NAMES.has(first);
}

/**
 * عرض موحّد: «الشيخ: سالم الطويل» دون تكرار اللقب.
 * إن كان المدخل لقبًا بلا اسم → سلسلة فارغة.
 */
export function formatSheikhName(name: string): string {
  const core = stripSheikhHonorifics(name);
  if (!core) return "";
  const title = isFemaleName(name) ? "الشيخة" : "الشيخ";
  return `${title}: ${core}`;
}

/** Compare/filter key without the prefix. */
export function sheikhNameKey(name: string): string {
  return stripSheikhHonorifics(name).toLowerCase();
}

/** تطبيع للمقارنة بين وصفين (كتب/علماء) */
export function normalizeProseForCompare(text: string): string {
  return String(text || "")
    .replace(/[….]+$/u, "")
    .replace(/\s+/g, " ")
    .replace(/[«»""]/g, '"')
    .trim()
    .toLowerCase();
}

/** هل الملخص مجرد بادئة للنبذة/الوصف الكامل؟ */
export function isSummaryPrefixOfFull(summary: string, full: string): boolean {
  const s = normalizeProseForCompare(summary);
  const f = normalizeProseForCompare(full);
  if (!s || !f) return false;
  if (s === f) return true;
  return f.startsWith(s) && s.length >= 40;
}
