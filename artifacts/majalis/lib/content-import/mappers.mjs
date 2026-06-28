import { hashKey, normalizeKey } from "./dedupe.mjs";
import { normalizeBenefitsRow } from "./validators.mjs";
import { normalizeLessonRow } from "./lesson-field-policy.mjs";

function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  return "";
}

function parseSpecialties(row) {
  if (Array.isArray(row.specialties)) return row.specialties;
  if (row.specialty) return [String(row.specialty).trim()];
  const raw = row.specialties;
  if (typeof raw === "string" && raw.includes("|")) {
    return raw.split("|").map((s) => s.trim()).filter(Boolean);
  }
  if (raw) return [String(raw).trim()];
  return [];
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} row
 */
export function mapRowToPayload(type, row) {
  switch (type) {
    case "lessons":
      return mapLesson(row, false);
    case "courses":
      return mapLesson(row, true);
    case "sheikhs":
      return {
        name: pick(row, "name"),
        bio: pick(row, "bio", "biography"),
        city: pick(row, "city") || null,
        photo_url: pick(row, "photo_url", "image_url") || null,
        specialties: parseSpecialties(row),
        is_verified: row.is_verified !== false,
        ijazah: pick(row, "ijazah") || null,
        years_experience: row.years_experience != null ? Number(row.years_experience) : null,
      };
    case "books":
      return {
        title: pick(row, "title"),
        type: pick(row, "type") || "كتاب",
        category: pick(row, "category"),
        description: pick(row, "description") || null,
        external_url: pick(row, "external_url", "url", "source_url") || null,
        file_url: pick(row, "file_url") || null,
        status: pick(row, "status") || "approved",
      };
    case "articles":
      return {
        title: pick(row, "title"),
        type: "مقال",
        category: pick(row, "category"),
        description: pick(row, "description", "summary"),
        external_url: pick(row, "source_url", "external_url", "url") || null,
        status: pick(row, "status") || "approved",
      };
    case "questions": {
      const confidence = row.confidence != null ? Number(row.confidence) : 80;
      return {
        question: pick(row, "question"),
        answer: pick(row, "answer"),
        category_name: pick(row, "category", "category_name"),
        ruling_type: pick(row, "ruling_type") || null,
        evidence: pick(row, "evidence") || null,
        reference: pick(row, "reference", "source") || null,
        status: pick(row, "status") || "published",
        review_status: confidence >= 70 ? "approved" : "needs_review",
        confidence,
      };
    }
    case "benefits": {
      const normalized = normalizeBenefitsRow(row);
      return {
        text: pick(normalized, "text"),
        author_name: pick(normalized, "author_name", "source", "author") || null,
        status: pick(normalized, "status") || "approved",
      };
    }
    case "adhkar": {
      const normalized = {
        ...row,
        count: row.count ?? row.repeat_count,
        source: pick(row, "source", "source_name"),
        category: pick(row, "category", "categoryId", "category_id"),
      };
      return {
        id: pick(normalized, "id") || `adh-import-${hashKey([normalized.text, normalized.category])}`,
        category: normalized.category,
        category_id: mapAdhkarCategoryId(normalized.category),
        text: pick(normalized, "text"),
        count: Number(normalized.count) || 1,
        source: normalized.source,
        source_name: normalized.source,
        narrator: pick(normalized, "narrator") || undefined,
        grade: pick(normalized, "grade") || undefined,
        reference: pick(normalized, "reference") || undefined,
        keywords: Array.isArray(normalized.keywords) ? normalized.keywords : [],
      };
    }
    case "rulings":
      return {
        external_key: pick(row, "external_key", "slug", "id") || `ruling-${hashKey([row.title, row.category])}`,
        title: pick(row, "title"),
        summary: pick(row, "summary") || null,
        body: pick(row, "body", "summary", "title"),
        category: pick(row, "category") || "فقه عام",
        subcategory: pick(row, "subcategory") || null,
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
        evidence: Array.isArray(row.evidence) ? row.evidence : [],
        references: Array.isArray(row.references) ? row.references : [],
        status: pick(row, "status") || "approved",
        verification_status: pick(row, "verification_status") || "approved",
        importance_score: row.importance_score != null ? Number(row.importance_score) : 50,
        published_at: pick(row, "published_at") || new Date().toISOString(),
      };
    default:
      return { ...row };
  }
}

function mapLesson(row, isCourse) {
  const normalized = normalizeLessonRow(row);
  const sheikh = pick(normalized, "sheikh_name", "speaker_name");
  const day = pick(normalized, "day_of_week", "day");
  const time = pick(normalized, "lesson_time", "time");
  const schedule = pick(normalized, "schedule") || [day, time].filter(Boolean).join(" — ");
  const externalKey =
    pick(normalized, "external_key") ||
    `import-${hashKey([normalized.title, sheikh, normalized.mosque, day, time])}`;
  const keywords = Array.isArray(normalized.keywords)
    ? normalized.keywords.filter(Boolean)
    : normalized._data_incomplete
      ? ["بيانات_ناقصة"]
      : null;

  return {
    title: pick(normalized, "title"),
    speaker_name: sheikh || null,
    sheikh_name: sheikh || null,
    description: pick(normalized, "description") || pick(normalized, "title"),
    mosque: pick(normalized, "mosque", "location") || null,
    city: pick(normalized, "city", "governorate") || "العاصمة",
    region: pick(normalized, "region") || null,
    category: pick(normalized, "category") || "أخرى",
    day_of_week: day || null,
    lesson_time: time || null,
    schedule: schedule || null,
    audience: pick(normalized, "audience") || "الكل",
    delivery: pick(normalized, "delivery") || "حضور فقط",
    status: pick(normalized, "status") || "approved",
    activity_type: isCourse ? "دورة" : pick(normalized, "activity_type") || "درس",
    is_course: isCourse,
    external_key: externalKey,
    website_url: pick(normalized, "source_url", "site_url", "website_url") || null,
    source_url: pick(normalized, "source_url", "site_url", "website_url") || null,
    maps_url: pick(normalized, "maps_url") || null,
    live_url: pick(normalized, "live_url", "stream_url") || null,
    contact_phone: pick(normalized, "contact_phone", "phone") || null,
    organizer: pick(normalized, "organizer") || null,
    keywords: keywords?.length ? keywords : null,
  };
}

const ADHKAR_CATEGORY_MAP = {
  صباح: "adh-morning",
  "أذكار الصباح": "adh-morning",
  morning: "adh-morning",
  مساء: "adh-evening",
  "أذكار المساء": "adh-evening",
  evening: "adh-evening",
  نوم: "adh-sleep",
  sleep: "adh-sleep",
  "بعد الصلاة": "adh-after-salah",
  "after-salah": "adh-after-salah",
};

function mapAdhkarCategoryId(raw) {
  const key = normalizeKey(raw);
  for (const [k, id] of Object.entries(ADHKAR_CATEGORY_MAP)) {
    if (normalizeKey(k) === key) return id;
  }
  if (raw.startsWith("adh-")) return raw;
  return "adh-misc";
}

export { mapLesson };
