/**
 * Rule Engine — regex + linguistic rules (no AI).
 */
import {
  KUWAIT_GOVERNORATES,
  DAY_NAMES,
  CATEGORY_KEYWORDS,
  SHEIKH_PREFIXES,
} from "./knowledge-base.mjs";
import { EXTRACTION_FIELDS, CORE_EXTRACTION_FIELDS } from "./field-definitions.mjs";

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function extractSheikh(text) {
  const prefix = SHEIKH_PREFIXES.join("|");
  const m = text.match(new RegExp(`(?:${prefix})\\s+[^\\n،,]{3,60}`, "u"));
  if (!m) return "";
  return m[0].replace(new RegExp(`^(${prefix})\\s*`, "u"), "").trim();
}

function extractMosque(text) {
  const m = text.match(/(?:مسجد|جامع|مصلى)\s+[^\n،,]{3,60}/u);
  return m ? m[0].trim() : "";
}

function extractRegion(text) {
  const m = text.match(/(?:منطقة|حي|ضاحية)\s+[^\n،,]{3,40}/u);
  return m ? m[0].replace(/^(منطقة|حي|ضاحية)\s*/u, "").trim() : "";
}

function extractDate(text) {
  const iso = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/)?.[0];
  if (iso) return iso.replace(/\//g, "-");
  const dmy = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}/)?.[0];
  if (dmy) {
    const [d, m, y] = dmy.split(/[-/]/);
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function extractTime(text) {
  const clock = text.match(/\d{1,2}[:.]?\d{0,2}\s*(?:ص|م|صباحاً|مساءً)/u)?.[0];
  if (clock) return clock.trim();
  return text.match(/بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء)/u)?.[0]?.trim() || "";
}

function extractDay(text) {
  for (const d of DAY_NAMES) {
    if (text.includes(d)) return d;
  }
  return "";
}

function extractPhone(text) {
  const m = text.match(/(?:\+965|00965|965)?[\s-]?\d{4}[\s-]?\d{4}/)?.[0];
  return m ? m.replace(/\s/g, "") : "";
}

function extractWhatsapp(text) {
  const m = text.match(/(?:واتس(?:اب)?|whatsapp)[:\s]*(?:\+965|965)?[\s-]?\d+/iu)?.[0];
  if (!m) return "";
  const num = m.match(/\d{4,}/)?.[0];
  return num ? `+965${num.replace(/^965/, "")}` : "";
}

function extractEmail(text) {
  return text.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || "";
}

function extractUrls(text) {
  return text.match(/https?:\/\/[^\s]+/g) || [];
}

function extractQrHint(text) {
  if (/qr|باركود|رمز|scan/i.test(text)) return "detected_in_text";
  return "";
}

function extractCategory(text) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return cat;
  }
  return "";
}

function extractActivityType(text) {
  if (/دورة/u.test(text)) return "دورة";
  if (/محاضرة/u.test(text)) return "محاضرة";
  if (/حلقة/u.test(text)) return "حلقة";
  if (/ملتقى/u.test(text)) return "ملتقى";
  if (/متون|متن/u.test(text)) return "متون";
  return "درس";
}

function extractTitle(text, speaker, mosque) {
  const lines = text.split(/\n/).map(clean).filter((l) => l.length > 4);
  for (const line of lines) {
    if (speaker && line.includes(speaker.slice(0, 8))) continue;
    if (mosque && line.includes(mosque.slice(0, 6))) continue;
    if (/^(?:مسجد|جامع|الشيخ|الوقت|التاريخ)/u.test(line)) continue;
    if (line.length >= 8) return line.slice(0, 120);
  }
  return lines[0]?.slice(0, 120) || "";
}

function extractOrganizer(text) {
  const m = text.match(/(?:ينظم|تنظيم|الجهة|بإشراف|تحت رعاية)\s*[:：]?\s*([^\n،,]{4,50})/u);
  return m ? m[1].trim() : "";
}

function extractCourseSeries(text) {
  const course = text.match(/(?:دورة|برنامج)\s+[«"]?([^«"\n،,]{4,60})/u)?.[1]?.trim() || "";
  const series = text.match(/(?:سلسلة|مسلسل)\s+[«"]?([^«"\n،,]{4,60})/u)?.[1]?.trim() || "";
  return { course_name: course, series_name: series };
}

export function runRuleEngine(rawText, hints = {}) {
  const text = clean(rawText);
  const urls = extractUrls(text);
  const speaker = extractSheikh(text) || hints.speaker || "";
  const mosque = extractMosque(text) || hints.mosque || "";
  const { course_name, series_name } = extractCourseSeries(text);

  const fields = {
    title: extractTitle(text, speaker, mosque),
    speaker_name: speaker,
    gregorian_date: extractDate(text),
    day_of_week: extractDay(text),
    lesson_time: extractTime(text),
    mosque,
    region: extractRegion(text),
    city: KUWAIT_GOVERNORATES.find((g) => text.includes(g)) || (text.includes("الكويت") ? "الكويت" : ""),
    country: "الكويت",
    category: extractCategory(text),
    description: text.slice(0, 500),
    organizer: extractOrganizer(text),
    cooperative_org: "",
    phone: extractPhone(text),
    whatsapp: extractWhatsapp(text),
    email: extractEmail(text),
    live_url: urls.find((u) => /youtube|live|stream|zoom/i.test(u)) || "",
    registration_url: urls.find((u) => /register|form|google|bit\.ly/i.test(u)) || urls[0] || "",
    maps_url: urls.find((u) => /maps|goo\.gl|google\.com\/maps/i.test(u)) || "",
    activity_type: extractActivityType(text),
    is_course: /دورة/u.test(text),
    course_name,
    series_name,
    language: "ar",
    source: hints.source || "rule_engine",
    qr_code_url: extractQrHint(text),
    raw_ocr_text: text,
    links: urls,
    keywords: [],
    slug: "",
    confidence: 0,
    confidence_reason: "",
  };

  if (!fields.registration_url && urls.length === 1) fields.registration_url = urls[0];

  const coreFilled = CORE_EXTRACTION_FIELDS.filter((f) => {
    const v = fields[f];
    return v !== "" && v !== false && v != null;
  });

  const filled = EXTRACTION_FIELDS.filter((f) => {
    const v = fields[f];
    return v !== "" && v !== false && v != null && !(Array.isArray(v) && v.length === 0);
  });

  return {
    fields,
    filledCount: filled.length,
    coreFilledCount: coreFilled.length,
    completeness: coreFilled.length / CORE_EXTRACTION_FIELDS.length,
    extractedVia: "rule_engine",
  };
}

export { extractSheikh, extractMosque, extractDate, extractTime, extractPhone };
