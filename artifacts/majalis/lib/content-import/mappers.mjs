import { hashKey, normalizeKey } from "./dedupe.mjs";

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
    case "benefits":
      return {
        text: pick(row, "text"),
        author_name: pick(row, "author_name", "source", "author") || null,
        status: pick(row, "status") || "approved",
      };
    case "adhkar":
      return {
        id: pick(row, "id") || `adh-import-${hashKey([row.text, row.category])}`,
        categoryId: mapAdhkarCategoryId(pick(row, "category", "categoryId")),
        text: pick(row, "text"),
        count: Number(row.count) || 1,
        source: pick(row, "source"),
        narrator: pick(row, "narrator") || undefined,
        grade: pick(row, "grade") || undefined,
        reference: pick(row, "reference") || undefined,
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
      };
    case "quran_surahs":
      return {
        number: Number(row.number),
        name: pick(row, "name"),
        englishName: pick(row, "englishName", "english_name") || "",
        ayahs: Number(row.ayahs),
        revelation: pick(row, "revelation") || "مكية",
        summary: pick(row, "summary", "description") || "",
        themes: Array.isArray(row.themes) ? row.themes : [],
      };
    case "quran_topics":
      return {
        id: pick(row, "id") || `qtopic-${hashKey([row.title, row.category])}`,
        title: pick(row, "title"),
        summary: pick(row, "summary", "description"),
        category: pick(row, "category"),
        surahRefs: Array.isArray(row.surahRefs) ? row.surahRefs : [],
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
      };
    default:
      return { ...row };
  }
}

function mapLesson(row, isCourse) {
  const sheikh = pick(row, "sheikh_name", "speaker_name");
  const day = pick(row, "day_of_week", "day");
  const time = pick(row, "lesson_time", "time");
  const schedule = pick(row, "schedule") || [day, time].filter(Boolean).join(" — ");
  const externalKey =
    pick(row, "external_key") ||
    `import-${hashKey([row.title, sheikh, row.mosque, day, time])}`;

  const eventDate = pick(row, "date", "start_date");
  const isRecurring = pick(row, "is_recurring");
  const recurring = isRecurring === false || isRecurring === "false" ? false : isRecurring !== true && isRecurring !== "true" ? !eventDate : true;

  return {
    title: pick(row, "title"),
    speaker_name: sheikh || null,
    sheikh_name: sheikh || null,
    description: pick(row, "description"),
    mosque: pick(row, "mosque", "location"),
    city: pick(row, "city", "governorate") || "العاصمة",
    region: pick(row, "region") || null,
    category: pick(row, "category"),
    day_of_week: day || null,
    lesson_time: time || null,
    schedule: schedule || null,
    audience: pick(row, "audience") || "الكل",
    delivery: pick(row, "delivery") || "حضور فقط",
    status: pick(row, "status") || "approved",
    activity_type: isCourse ? "دورة" : pick(row, "activity_type") || "درس",
    is_course: isCourse,
    external_key: externalKey,
    website_url: pick(row, "source_url", "site_url") || null,
    maps_url: pick(row, "maps_url") || null,
    live_url: pick(row, "live_url", "stream_url") || null,
    poster_image_url: pick(row, "poster_image_url") || null,
    video_url: pick(row, "video_url", "recording_url") || null,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    start_date: eventDate || null,
    end_date: pick(row, "end_date") || (recurring === false && eventDate ? eventDate : null),
    is_recurring: recurring,
    organizer: pick(row, "organizer") || null,
    co_organizer: pick(row, "co_organizer") || null,
    has_women_place: Boolean(row.has_women_place),
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
