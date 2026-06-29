import type { CmsContentKind, CmsContentRecord } from "./content-types";

export type QualityField =
  | "title"
  | "date"
  | "time"
  | "am_pm"
  | "speaker"
  | "mosque"
  | "region"
  | "governorate"
  | "country"
  | "category"
  | "links"
  | "source";

export type QualityIssue = {
  field: QualityField;
  severity: "error" | "warning";
  message: string;
};

export type QualityReport = {
  ok: boolean;
  blocking: boolean;
  errors: QualityIssue[];
  warnings: QualityIssue[];
  needsReview: boolean;
  score: number;
};

const CRITICAL_FIELDS: QualityField[] = ["title"];
const IMPORTANT_FIELDS: QualityField[] = [
  "date",
  "time",
  "speaker",
  "mosque",
  "region",
  "governorate",
  "country",
  "category",
  "links",
  "source",
];

function pick(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function hasTimeAmPm(row: Record<string, unknown>): boolean {
  const time = pick(row, "lesson_time", "time", "schedule");
  if (!time) return false;
  if (/\b(ص|م|am|pm|صباح|مساء)\b/i.test(time)) return true;
  if (/\d{1,2}\s*[:：]\s*\d{2}/.test(time)) return true;
  return false;
}

/** Validate content quality — critical fields block in strict mode; important fields warn only. */
export function validateContentQuality(record: CmsContentRecord): QualityReport {
  const errors: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];
  const raw = { ...record.raw, ...record } as Record<string, unknown>;

  if (!record.title?.trim()) {
    errors.push({ field: "title", severity: "error", message: "العنوان مطلوب" });
  }

  const isLessonLike = ["lesson", "lecture", "course"].includes(record.kind);

  if (isLessonLike) {
    if (!pick(raw, "date", "start_date", "day_of_week", "schedule", "lesson_date")) {
      warnings.push({ field: "date", severity: "warning", message: "التاريخ أو اليوم غير محدد" });
    }
    if (!pick(raw, "lesson_time", "time") && !hasTimeAmPm(raw)) {
      warnings.push({ field: "time", severity: "warning", message: "الوقت غير محدد" });
    }
    if (!hasTimeAmPm(raw) && pick(raw, "lesson_time", "time")) {
      warnings.push({ field: "am_pm", severity: "warning", message: "صباحًا/مساءً غير واضح" });
    }
    if (!record.speaker_name && !pick(raw, "sheikh_name", "speaker_name")) {
      warnings.push({ field: "speaker", severity: "warning", message: "اسم الشيخ غير محدد" });
    }
    if (!pick(raw, "mosque", "location", "masjid")) {
      warnings.push({ field: "mosque", severity: "warning", message: "المسجد غير محدد" });
    }
    if (!pick(raw, "region", "area", "المنطقة")) {
      warnings.push({ field: "region", severity: "warning", message: "المنطقة غير محددة" });
    }
    if (!pick(raw, "governorate", "city", "محافظة")) {
      warnings.push({ field: "governorate", severity: "warning", message: "المحافظة غير محددة" });
    }
    if (!pick(raw, "country", "الدولة")) {
      warnings.push({ field: "country", severity: "warning", message: "الدولة غير محددة" });
    }
  }

  if (!record.category && !pick(raw, "category", "category_slug")) {
    warnings.push({ field: "category", severity: "warning", message: "التصنيف غير محدد" });
  }

  const urls = [
    ...(record.source_urls || []),
    pick(raw, "source_url", "website_url", "url", "registration_url", "pdf_url"),
  ].filter(Boolean);

  if (urls.length === 0) {
    warnings.push({ field: "links", severity: "warning", message: "لا روابط مصدر" });
  } else {
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          warnings.push({ field: "links", severity: "warning", message: `رابط غير صالح: ${url}` });
        }
      } catch {
        warnings.push({ field: "links", severity: "warning", message: `رابط غير صالح: ${url}` });
      }
    }
  }

  if (!pick(raw, "source", "source_type", "source_slug") && urls.length === 0) {
    warnings.push({ field: "source", severity: "warning", message: "المصدر غير محدد" });
  }

  const totalChecks = CRITICAL_FIELDS.length + IMPORTANT_FIELDS.length;
  const failedCritical = errors.length;
  const failedImportant = warnings.length;
  const score = Math.max(0, Math.round(((totalChecks - failedCritical - failedImportant * 0.5) / totalChecks) * 100));

  return {
    ok: errors.length === 0,
    blocking: errors.length > 0,
    errors,
    warnings,
    needsReview: warnings.length > 0,
    score,
  };
}

export function validateImportRow(kind: CmsContentKind, row: Record<string, unknown>): QualityReport {
  const title = pick(row, "title", "name", "question", "text");
  return validateContentQuality({
    kind,
    title,
    speaker_name: pick(row, "speaker_name", "sheikh_name", "author_name"),
    category: pick(row, "category", "category_slug"),
    source_urls: [pick(row, "source_url", "url", "website_url")].filter(Boolean),
    raw: row,
  });
}
