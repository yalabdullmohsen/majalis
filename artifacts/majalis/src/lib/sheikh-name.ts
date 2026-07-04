const HONORIFIC_PREFIX =
  /^(?:فضيلة|معالي|سمو|صاحب|العلامة|الشيخ(?:ة)?(?:\s+الدكتور(?:ة)?|\s+د\.?)?|الدكتور(?:ة)?|د\.|Dr\.?)\s+/iu;

const DEGREE_PREFIX = /^(?:د\.|Dr\.)\s*/iu;

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

  for (let i = 0; i < 4; i += 1) {
    const next = value.replace(HONORIFIC_PREFIX, "").replace(DEGREE_PREFIX, "").trim();
    if (next === value) break;
    value = next;
  }

  return value.replace(/\s+/g, " ").trim();
}

/** هل الاسم مؤنث؟ (يحمل "الشيخة" أو اسم أول نسائي) */
export function isFemaleName(name: string): boolean {
  const raw = String(name || "").trim();
  if (/الشيخة/u.test(raw)) return true;
  const core = stripSheikhHonorifics(raw);
  const first = core.split(/\s+/)[0] ?? "";
  return FEMALE_FIRST_NAMES.has(first);
}

/** Unified display: الشيخ/الشيخة: سالم الطويل */
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
