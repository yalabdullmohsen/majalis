import { adminFetch } from "@/lib/admin-api";

export type ParsedLessonFields = {
  title?: string;
  speaker_name?: string;
  gregorian_date?: string;
  start_date?: string;
  day_of_week?: string;
  lesson_time?: string;
  mosque?: string;
  region?: string;
  city?: string;
  country?: string;
  category?: string;
  description?: string;
  organizer?: string;
  cooperative_org?: string;
  has_live_stream?: boolean;
  has_women_section?: boolean;
  women_section?: string;
  phone?: string;
  live_url?: string;
  registration_url?: string;
  maps_url?: string;
  links?: string[];
  keywords?: string[];
  slug?: string;
  raw_ocr_text?: string;
  confidence?: number;
  is_course?: boolean;
  activity_type?: string;
  end_date?: string;
  platform?: string;
  source_url?: string;
};

export type LessonImportResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  vision_enabled?: boolean;
  extracted_text?: string;
  parsed_fields?: ParsedLessonFields;
  confidence_score?: number;
  warnings?: { field: string; message: string }[];
  missing_fields?: string[];
  suggested_sheikh_match?: {
    matched?: { id: string; name: string } | null;
    score?: number;
    proposed?: { name: string } | null;
  };
  draft_lesson_payload?: ParsedLessonFields;
  draft_id?: string;
  draft?: Record<string, unknown>;
  image_url?: string;
  source_url?: string;
  platform?: string;
  platform_label?: string;
  duplicate?: {
    isDuplicate?: boolean;
    draft?: { id?: string; status?: string };
    lesson?: { id?: string; title?: string };
  };
  partial?: boolean;
  extraction_failed?: boolean;
  lesson?: Record<string, unknown>;
  validation?: { valid: boolean; errors: { field: string; message: string }[]; warnings: unknown[] };
  storage_uploaded?: boolean;
  storage_error?: string;
  provider_used?: "anthropic" | "openai" | "ocr" | "manual_review";
  provider_label?: string;
  manual_review?: boolean;
  user_message?: string;
  error_code?: string;
  fields?: {
    title?: string;
    sheikh?: string;
    mosque?: string;
    date?: string;
    time?: string;
    city?: string;
    registrationUrl?: string;
    phone?: string;
    notes?: string;
  };
};

async function postLessonFromImage(body: Record<string, unknown>): Promise<LessonImportResponse> {
  const res = await adminFetch("/api/admin/lesson-from-image", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

async function postLessonFromUrl(body: Record<string, unknown>): Promise<LessonImportResponse> {
  const res = await adminFetch("/api/admin/lesson-from-url", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractLessonFromImageUpload(
  file: File,
  opts?: { sourceUrl?: string; notes?: string },
): Promise<LessonImportResponse> {
  const base64 = await fileToBase64(file);
  return postLessonFromImage({
    action: "extract",
    imageBase64: base64,
    mimeType: file.type || "image/jpeg",
    source_url: opts?.sourceUrl,
    notes: opts?.notes,
  });
}

export async function extractLessonFromUrl(url: string, notes?: string): Promise<LessonImportResponse> {
  return postLessonFromUrl({ action: "extract", url, notes });
}

export async function saveLessonImportDraft(
  parsed: ParsedLessonFields,
  opts?: { draftId?: string; imageUrl?: string; extractedText?: string; notes?: string; sourceUrl?: string; status?: string },
) {
  return postLessonFromImage({
    action: opts?.draftId ? "update-draft" : "save-draft",
    draftId: opts?.draftId,
    parsed_fields: parsed,
    image_url: opts?.imageUrl,
    extracted_text: opts?.extractedText,
    notes: opts?.notes,
    source_url: opts?.sourceUrl,
    status: opts?.status || "draft",
  });
}

export async function sendLessonImportToReview(
  parsed: ParsedLessonFields,
  opts?: { draftId?: string; imageUrl?: string; extractedText?: string; notes?: string },
) {
  return saveLessonImportDraft(parsed, { ...opts, status: "needs_review" });
}

export async function fetchVisionAiStatus(): Promise<Record<string, unknown>> {
  const res = await adminFetch("/api/admin/ai-status", { method: "GET" });
  return res.json();
}

export async function saveLessonImportFromUrl(
  parsed: ParsedLessonFields,
  opts?: { draftId?: string; imageUrl?: string; extractedText?: string; notes?: string; sourceUrl?: string },
) {
  return postLessonFromUrl({
    action: opts?.draftId ? "update-draft" : "save-draft",
    draftId: opts?.draftId,
    parsed_fields: parsed,
    image_url: opts?.imageUrl,
    extracted_text: opts?.extractedText,
    notes: opts?.notes,
    source_url: opts?.sourceUrl,
    source_type: "url",
    status: "draft",
  });
}

export async function approveLessonImportDraft(draftId: string, parsed: ParsedLessonFields) {
  return postLessonFromImage({ action: "approve", draftId, parsed_fields: parsed });
}

export async function approveLessonImportFromUrl(draftId: string, parsed: ParsedLessonFields) {
  return postLessonFromUrl({ action: "approve", draftId, parsed_fields: parsed });
}

export async function rejectLessonImportDraft(draftId: string) {
  return postLessonFromImage({ action: "reject", draftId });
}

export async function rejectLessonImportFromUrl(draftId: string) {
  return postLessonFromUrl({ action: "reject", draftId });
}

export async function reExtractLessonImportDraft(draftId: string, file: File) {
  const base64 = await fileToBase64(file);
  return postLessonFromImage({
    action: "re-extract",
    draftId,
    imageBase64: base64,
    mimeType: file.type || "image/jpeg",
  });
}

export async function reExtractLessonFromUrl(draftId: string) {
  return postLessonFromUrl({ action: "re-extract", draftId });
}

export async function getLessonImportDraft(draftId: string) {
  return postLessonFromImage({ action: "get", draftId });
}

export async function listLessonImportDrafts(status?: string) {
  return postLessonFromImage({ action: "list", status });
}

export const FIELD_LABELS: Record<string, string> = {
  title: "عنوان الدرس",
  speaker_name: "اسم الشيخ",
  gregorian_date: "التاريخ الميلادي",
  start_date: "تاريخ البداية",
  day_of_week: "اليوم",
  lesson_time: "الوقت",
  mosque: "المسجد",
  region: "المنطقة",
  city: "المحافظة",
  country: "الدولة",
  category: "التصنيف",
  description: "وصف مختصر",
  organizer: "الجهة المنظمة",
  cooperative_org: "الجهة المتعاونة",
  has_live_stream: "بث مباشر",
  has_women_section: "مكان للنساء",
  women_section: "تفاصيل مكان النساء",
  phone: "رقم التواصل",
  live_url: "رابط البث",
  registration_url: "رابط التسجيل",
  maps_url: "رابط الخريطة",
  slug: "Slug مقترح",
  keywords: "الكلمات المفتاحية",
  end_date: "تاريخ الانتهاء",
  activity_type: "نوع النشاط",
};

export const EMPTY_PARSED: ParsedLessonFields = {
  title: "",
  speaker_name: "",
  gregorian_date: "",
  day_of_week: "",
  lesson_time: "",
  mosque: "",
  region: "",
  city: "العاصمة",
  country: "الكويت",
  category: "",
  description: "",
  organizer: "",
  cooperative_org: "",
  has_live_stream: false,
  has_women_section: false,
  women_section: "",
  phone: "",
  live_url: "",
  registration_url: "",
  maps_url: "",
  links: [],
  keywords: [],
  slug: "",
  raw_ocr_text: "",
};
