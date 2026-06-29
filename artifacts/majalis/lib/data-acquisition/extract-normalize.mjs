import { cleanText, createExternalKey } from "../auto-content/auto-content-utils.mjs";
import { createHash } from "node:crypto";

/** Extract fields from parsed record — NEVER invent missing data */
export function extractFields(source, record) {
  const raw = record.raw || {};
  const format = record.format;

  let title = "";
  let description = "";
  let originalUrl = source.source_url;
  let externalId = "";

  if (format === "rss_item") {
    title = cleanText(raw.title || "");
    description = cleanText(raw.description || raw.content || "");
    originalUrl = raw.link || raw.url || originalUrl;
    externalId = raw.guid || raw.id || createExternalKey(source.slug, originalUrl, title);
  } else if (format === "json" || format === "csv") {
    title = cleanText(raw.title || raw.name || raw.subject || raw.عنوان || "");
    description = cleanText(raw.description || raw.desc || raw.summary || raw.وصف || "");
    originalUrl = raw.url || raw.link || raw.original_url || originalUrl;
    externalId = raw.id || raw.external_id || createExternalKey(source.slug, originalUrl, title);
  } else if (format === "html") {
    title = cleanText(raw.title || "");
    description = cleanText(raw.description || "");
    originalUrl = raw.url || originalUrl;
    externalId = createExternalKey(source.slug, originalUrl, title);
  } else {
    title = cleanText(raw.title || source.name);
    description = cleanText(raw.text || raw.body || raw.note || "");
    originalUrl = raw.url || originalUrl;
    externalId = createExternalKey(source.slug, originalUrl, title);
  }

  const extracted = {
    title,
    description,
    original_url: originalUrl,
    external_id: externalId,
    source_url: source.source_url,
    scholar_name: pick(raw, ["scholar", "sheikh", "speaker", "الشيخ", "المحاضر"]) || null,
    author_name: pick(raw, ["author", "writer", "researcher", "المؤلف", "الباحث"]) || null,
    event_date: pick(raw, ["date", "event_date", "التاريخ"]) || parseDateFromText(`${title} ${description}`),
    event_time: pick(raw, ["time", "event_time", "الوقت"]) || parseTimeFromText(`${title} ${description}`),
    time_period: detectPeriod(`${title} ${description}`),
    location: pick(raw, ["location", "place", "المكان"]) || null,
    mosque_name: pick(raw, ["mosque", "masjid", "المسجد"]) || null,
    region: pick(raw, ["region", "area", "المنطقة"]) || null,
    governorate: pick(raw, ["governorate", "province", "المحافظة"]) || null,
    country: pick(raw, ["country", "الدولة"]) || source.country || null,
    organizer: pick(raw, ["organizer", "organization", "الجهة"]) || null,
    stream_url: pick(raw, ["stream_url", "live_url", "youtube", "broadcast"]) || null,
    map_url: pick(raw, ["map_url", "maps", "location_url"]) || null,
    file_url: pick(raw, ["file_url", "pdf", "download"]) || null,
    language: pick(raw, ["language", "lang"]) || "ar",
    attribution: source.name,
    needs_field_review: [],
  };

  if (!title) extracted.needs_field_review.push("missing_title");
  if (!description) extracted.needs_field_review.push("missing_description");
  if (!extracted.event_date && /درس|محاض|حلقة|دورة/.test(title)) {
    extracted.needs_field_review.push("missing_date");
  }

  return extracted;
}

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

function parseDateFromText(text) {
  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const ar = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ar) return `${ar[3]}-${ar[2].padStart(2, "0")}-${ar[1].padStart(2, "0")}`;
  return null;
}

function parseTimeFromText(text) {
  const t = text.match(/(\d{1,2}:\d{2})/);
  return t ? t[1] : null;
}

function detectPeriod(text) {
  if (/صباح|فجر|ظهر|بعد الفجر|ص/.test(text)) return "صباحاً";
  if (/مساء|مغرب|عشاء|بعد المغرب|م/.test(text)) return "مساءً";
  return null;
}

export function normalizeExtracted(item) {
  return {
    ...item,
    title: item.title?.trim() || "",
    normalized_title: normalizeArabic(item.title || ""),
    title_hash: hashText(item.title || ""),
    content_hash: hashText(`${item.title}|${item.description}|${item.original_url}`),
    description: item.description?.trim() || "",
  };
}

export function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hashText(text) {
  return createHash("sha256").update(normalizeArabic(text), "utf8").digest("hex").slice(0, 32);
}

export function classifyContent(source, item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const fromSource = source.content_types?.[0];

  const rules = [
    ["fatwas", /فتو|فتاو|حكم شرع/i],
    ["questions", /سؤال|أسئلة|استفت/i],
    ["research", /بحث|دراسة|paper|journal/i],
    ["books", /كتاب|مؤلف|طبعة/i],
    ["scholars", /ترجم|شيخ|عالم|biograph/i],
    ["quran_circles", /حلقة.*قرآ|تحفي|ختم/i],
    ["mutoon_circles", /متن|حلقة.*مت/i],
    ["courses", /دورة|برنامج|منهج/i],
    ["mosques", /مسجد|جامع/i],
    ["benefits", /فائدة|فوائد/i],
    ["calendar", /تقويم|موعد|جدول/i],
    ["announcements", /إعلان|تنويه|دعو/i],
    ["lectures", /محاض/i],
    ["lessons", /درس|دروس/i],
    ["opportunities", /فرص|منحة|تسجيل/i],
  ];

  for (const [type, re] of rules) {
    if (re.test(text)) return type;
  }
  return fromSource || "articles";
}
