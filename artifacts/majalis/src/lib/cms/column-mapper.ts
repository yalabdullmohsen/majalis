/** Auto-map import column headers to canonical field names. */

export type ColumnMapping = {
  source: string;
  target: string;
  confidence: number;
};

const FIELD_ALIASES: Record<string, string[]> = {
  title: ["title", "name", "عنوان", "العنوان", "lesson_title", "poster_title"],
  speaker_name: ["speaker_name", "sheikh_name", "sheikh", "speaker", "الشيخ", "اسم_الشيخ", "المحاضر"],
  mosque: ["mosque", "location", "masjid", "المسجد", "مكان"],
  day_of_week: ["day_of_week", "day", "اليوم", "يوم"],
  lesson_time: ["lesson_time", "time", "الوقت", "وقت"],
  date: ["date", "start_date", "lesson_date", "gregorian_date", "التاريخ"],
  governorate: ["governorate", "city", "محافظة", "المدينة"],
  region: ["region", "area", "المنطقة", "منطقة"],
  country: ["country", "الدولة", "دولة"],
  category: ["category", "category_slug", "التصنيف", "قسم"],
  description: ["description", "summary", "bio", "note", "الوصف", "ملخص"],
  body: ["body", "answer", "content", "text", "biography", "المحتوى", "النص"],
  question: ["question", "السؤال"],
  source_url: ["source_url", "url", "website_url", "permalink", "registration_url", "الرابط"],
  external_key: ["external_key", "id", "key", "معرف"],
  text: ["text", "faidah", "benefit", "الفائدة"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function matchScore(header: string, alias: string): number {
  const h = normalizeHeader(header);
  const a = normalizeHeader(alias);
  if (h === a) return 1;
  if (h.includes(a) || a.includes(h)) return 0.85;
  return 0;
}

/** Suggest column mappings from CSV/Excel headers. */
export function suggestColumnMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  for (const header of headers) {
    let bestTarget = "";
    let bestScore = 0;

    for (const [target, aliases] of Object.entries(FIELD_ALIASES)) {
      if (usedTargets.has(target)) continue;
      for (const alias of aliases) {
        const score = matchScore(header, alias);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = target;
        }
      }
    }

    if (bestTarget && bestScore >= 0.85) {
      mappings.push({ source: header, target: bestTarget, confidence: bestScore });
      usedTargets.add(bestTarget);
    } else {
      mappings.push({ source: header, target: header, confidence: 0.5 });
    }
  }

  return mappings;
}

/** Apply column mappings to transform raw rows. */
export function applyColumnMappings(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const m of mappings) {
      if (row[m.source] != null && row[m.source] !== "") {
        out[m.target] = row[m.source];
      }
    }
    for (const [k, v] of Object.entries(row)) {
      if (!(k in out) && v != null && v !== "") {
        out[k] = v;
      }
    }
    return out;
  });
}

export function mappingSummary(mappings: ColumnMapping[]): string {
  const mapped = mappings.filter((m) => m.source !== m.target && m.confidence >= 0.85);
  if (!mapped.length) return "لا مطابقة تلقائية — الأعمدة كما هي";
  return mapped.map((m) => `${m.source} → ${m.target}`).join(" · ");
}
