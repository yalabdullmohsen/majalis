// خدمة الاقتباسات — مجالس

const BASE = "/api/citations";
const USER_BASE = "/api/user/citations";

// ── أنواع ────────────────────────────────────────────────────────────────────

export type CitationContentType =
  | "quran_ayah" | "hadith" | "scholar_quote" | "fatwa" | "book"
  | "article" | "research" | "lesson" | "benefit" | "prophet_story" | "qa";

export type CitationStyle = "default" | "apa" | "mla" | "chicago" | "turabian";

export interface CitationSource {
  id: string;
  content_type: CitationContentType;
  reference_id?: string | null;
  knowledge_node_id?: string | null;
  title_ar: string;
  author_name?: string | null;
  book_name?: string | null;
  volume?: string | null;
  page_number?: string | null;
  publisher?: string | null;
  publish_year?: number | null;
  source_url?: string | null;
  is_approved: boolean;
}

export interface Citation {
  id: string;
  source_id: string;
  source?: CitationSource;
  quoted_text: string;
  text_start_offset?: number | null;
  text_end_offset?: number | null;
  deep_link_slug: string;
  citation_style?: CitationStyle | null;
  created_at: string;
}

export interface SavedCitation {
  id: string;
  citation_id: string;
  citation?: Citation;
  folder_id?: string | null;
  personal_note?: string | null;
  is_favorite: boolean;
  usage_count: number;
  saved_at: string;
}

export interface CitationFolder {
  id: string;
  user_id: string;
  folder_name: string;
  color: string;
  created_at: string;
}

export interface CreateCitationPayload {
  source_id: string;
  quoted_text: string;
  text_start_offset?: number;
  text_end_offset?: number;
  citation_style?: CitationStyle;
}

// ── ثوابت التسميات ───────────────────────────────────────────────────────────

export const CONTENT_TYPE_LABEL: Record<CitationContentType, string> = {
  quran_ayah:   "آية قرآنية",
  hadith:       "حديث",
  scholar_quote:"قول عالم",
  fatwa:        "فتوى",
  book:         "كتاب",
  article:      "مقال",
  research:     "بحث",
  lesson:       "درس",
  benefit:      "فائدة",
  prophet_story:"قصة نبوية",
  qa:           "سؤال وجواب",
};

export const CONTENT_TYPE_COLOR: Record<CitationContentType, string> = {
  quran_ayah:   "#065f46",
  hadith:       "#1d4ed8",
  scholar_quote:"#7c3aed",
  fatwa:        "#1F4D3A",
  book:         "#1F4D3A",
  article:      "#0369a1",
  research:     "#0c4a6e",
  lesson:       "#047857",
  benefit:      "#166534",
  prophet_story:"#dc2626",
  qa:           "#6b7280",
};

export function citTypeClass(t: CitationContentType | string): string {
  return `cit-type--${String(t).replace(/_/g, "-")}`;
}

export const STYLE_LABEL: Record<CitationStyle, string> = {
  default:  "الافتراضي",
  apa:      "APA",
  mla:      "MLA",
  chicago:  "Chicago",
  turabian: "Turabian",
};

export const MAX_QUOTE_LENGTH = 500;
export const PLATFORM_URL = "https://majlisilm.com";

// ── مساعدات ──────────────────────────────────────────────────────────────────

export function getShareUrl(slug: string) {
  return `${PLATFORM_URL}/c/${slug}`;
}

export function getQrCodeUrl(slug: string) {
  return `${BASE}/${slug}/qrcode`;
}

export function getCitationImageUrl(slug: string, dark = false) {
  return `${BASE}/${slug}/image${dark ? "?dark=1" : ""}`;
}

/** استخراج توكن المصادقة الحالي من Supabase session */
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// ── واجهات الـ API ────────────────────────────────────────────────────────────

export async function createCitation(
  payload: CreateCitationPayload,
): Promise<{ ok: boolean; citation?: Citation; share_url?: string; error?: string }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchCitationBySlug(
  slug: string,
): Promise<{ ok: boolean; citation?: Citation; error?: string }> {
  const res = await fetch(`${BASE}/${slug}`);
  return res.json();
}

export async function saveCitationToLibrary(
  citationId: string,
  opts: { folder_id?: string; personal_note?: string } = {},
): Promise<{ ok: boolean; saved?: SavedCitation; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  const res = await fetch(`${BASE}/${citationId}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export async function fetchUserCitations(filters?: {
  folder?: string;
  search?: string;
  favorite?: boolean;
  sort?: "saved_at" | "usage_count";
}): Promise<{ ok: boolean; saved?: SavedCitation[]; folders?: CitationFolder[]; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  const params = new URLSearchParams();
  if (filters?.folder) params.set("folder", filters.folder);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.favorite) params.set("favorite", "true");
  if (filters?.sort) params.set("sort", filters.sort);

  const res = await fetch(`${USER_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createCitationFolder(
  folderName: string,
  color = "#065f46",
): Promise<{ ok: boolean; folder?: CitationFolder; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  const res = await fetch(`${USER_BASE}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ folder_name: folderName, color }),
  });
  return res.json();
}

export async function exportCitations(
  format: "markdown" | "pdf",
  ids?: string[],
): Promise<{ ok?: boolean; saved?: SavedCitation[]; error?: string } | Blob> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "مطلوب تسجيل الدخول" };

  const res = await fetch(`${USER_BASE}/export?format=${format}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids }),
  });

  if (format === "markdown") return res.blob();
  return res.json();
}

export async function fetchFormattedCitation(
  sourceId: string,
  style: CitationStyle = "default",
): Promise<{ ok: boolean; formatted?: string; error?: string }> {
  const res = await fetch(`${BASE}/format?id=${sourceId}&style=${style}`);
  return res.json();
}
