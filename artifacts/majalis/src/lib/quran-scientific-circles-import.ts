import type { QuranScientificCircle } from "./quran-scientific-circles-types";

export type ExtractedCircleFields = Partial<QuranScientificCircle> & {
  confidence?: number;
  missingFields?: string[];
};

const CORE_FIELDS = ["title", "tab_group", "country"] as const;

export function assessImportCompleteness(row: Partial<QuranScientificCircle>): {
  data_incomplete: boolean;
  missingFields: string[];
  confidence: number;
} {
  const missingFields = CORE_FIELDS.filter((f) => !row[f]?.toString().trim());
  const optional = [
    "sheikh_name",
    "organizer",
    "venue_name",
    "lesson_time",
    "contact_phone",
    "start_date",
  ];
  const missingOptional = optional.filter((f) => !row[f as keyof QuranScientificCircle]);
  const confidence = Math.max(
    0,
    1 - (missingFields.length * 0.25 + missingOptional.length * 0.05),
  );
  return {
    data_incomplete: missingFields.length > 0 || missingOptional.length >= 4,
    missingFields: [...missingFields, ...missingOptional],
    confidence,
  };
}

export function normalizeImportRow(raw: Record<string, unknown>): Partial<QuranScientificCircle> {
  const days = raw.days;
  return {
    title: String(raw.title || raw.announcementTitle || raw.lessonTitle || "").trim(),
    summary: String(raw.summary || raw.announcementTitle || "").trim() || undefined,
    description: String(raw.description || raw.body || "").trim() || undefined,
    tab_group: (raw.tab_group || raw.tabGroup || "quran") as QuranScientificCircle["tab_group"],
    subcategory_slug: String(raw.subcategory_slug || raw.subcategory || "").trim() || undefined,
    circle_type: String(raw.circle_type || raw.type || "").trim() || undefined,
    country: String(raw.country || "الكويت").trim(),
    governorate: String(raw.governorate || "").trim() || undefined,
    region: String(raw.region || "").trim() || undefined,
    venue_name: String(raw.venue_name || raw.mosque || raw.venue || "").trim() || undefined,
    organizer: String(raw.organizer || "").trim() || undefined,
    sheikh_name: String(raw.sheikh_name || raw.sheikh || "").trim() || undefined,
    supervisor_name: String(raw.supervisor_name || raw.supervisor || "").trim() || undefined,
    gender_access: String(raw.gender_access || raw.gender || "عام").trim(),
    level: String(raw.level || "").trim() || undefined,
    days: Array.isArray(days) ? days.map(String) : days ? [String(days)] : [],
    start_date: String(raw.start_date || raw.date || "").trim() || undefined,
    lesson_time: String(raw.lesson_time || raw.time || "").trim() || undefined,
    registration_url: String(raw.registration_url || raw.registrationUrl || "").trim() || undefined,
    contact_phone: String(raw.contact_phone || raw.contactPhone || "").trim() || undefined,
    whatsapp_url: String(raw.whatsapp_url || raw.whatsapp || "").trim() || undefined,
    map_url: String(raw.map_url || raw.mapUrl || "").trim() || undefined,
    announcement_url: String(raw.announcement_url || raw.announcementUrl || "").trim() || undefined,
    has_live: Boolean(raw.has_live || raw.liveUrl),
    has_attendance: raw.has_attendance !== false,
    is_online: Boolean(raw.is_online || raw.isOnline),
    has_certificate: Boolean(raw.has_certificate),
    has_ijazah: Boolean(raw.has_ijazah),
    is_free: raw.is_free !== false,
    status: (raw.status as QuranScientificCircle["status"]) || "review",
    notes: String(raw.notes || "").trim() || undefined,
    external_key: String(raw.external_key || raw.id || "").trim() || undefined,
  };
}

export function parseCirclesJson(text: string): Partial<QuranScientificCircle>[] {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows.map((r) => normalizeImportRow(r as Record<string, unknown>));
}

export function parseCirclesCsv(text: string): Partial<QuranScientificCircle>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || "";
    });
    return normalizeImportRow(row);
  });
}

/** Stub for smart image extraction — delegates shape to lesson import pattern */
export function extractCircleFromPosterText(text: string): ExtractedCircleFields {
  const fields: ExtractedCircleFields = { status: "review" };
  const titleMatch = text.match(/(?:حلقة|دورة|برنامج|درس)[:\s]+(.+)/);
  if (titleMatch) fields.title = titleMatch[1].trim().slice(0, 120);

  const sheikhMatch = text.match(/(?:الشيخ|فضيلة|د\.?)\s+([^\n،]+)/);
  if (sheikhMatch) fields.sheikh_name = sheikhMatch[1].trim();

  const phoneMatch = text.match(/(?:\+?\d[\d\s-]{7,})/);
  if (phoneMatch) fields.contact_phone = phoneMatch[0].replace(/\s/g, "");

  const dayMatch = text.match(/(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)/);
  if (dayMatch) fields.days = [dayMatch[1]];

  const timeMatch = text.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:ص|م|مساء|صباح)|بعد صلاة [^\n]+)/);
  if (timeMatch) fields.lesson_time = timeMatch[1].trim();

  if (/نساء|نسائي/.test(text)) fields.gender_access = "نساء";
  if (/إجازة/.test(text)) fields.has_ijazah = true;
  if (/شهادة/.test(text)) fields.has_certificate = true;

  fields.tab_group = /متن|نووية|أصول|فقه/.test(text) ? "mutoon" : /جامعة|معهد|منحة/.test(text) ? "opportunities" : "quran";
  fields.country = "الكويت";

  const assessment = assessImportCompleteness(fields);
  fields.data_incomplete = assessment.data_incomplete;
  fields.missingFields = assessment.missingFields;
  fields.confidence = assessment.confidence;

  if (!fields.title) fields.title = "حلقة — بيانات مستخرجة من إعلان";
  return fields;
}

export function extractCircleFromUrl(_url: string): ExtractedCircleFields {
  return {
    title: "حلقة من رابط — يحتاج مراجعة",
    tab_group: "quran",
    country: "الكويت",
    status: "review",
    data_incomplete: true,
    confidence: 0.2,
    missingFields: ["sheikh_name", "venue_name", "lesson_time"],
    announcement_url: _url,
  };
}
