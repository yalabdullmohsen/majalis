/**
 * خدمة الباحث الشرعي (RAG) — Frontend
 */

const BASE = "/api/rag";

export type ContentType =
  | "quran_verse" | "hadith" | "tafsir" | "fatwa"
  | "fiqh_decision" | "book" | "lesson" | "benefit"
  | "article" | "ruling" | "story" | "quote" | "dhikr";

export type AnswerQuality = "full" | "partial" | "no_sources" | "blocked";

export type QueryIntent =
  | "quran" | "hadith" | "fiqh" | "scholar"
  | "compare" | "summary" | "source" | "general";

export interface RAGSource {
  index:        number;
  content_type: ContentType;
  type_label:   string;
  title:        string;
  excerpt:      string;
  source_ref:   string;
  source_url:   string;
  authority:    number;
  metadata:     Record<string, unknown>;
  href:         string;
}

export interface Opinion {
  title:      string;
  excerpt:    string;
  source:     string;
  source_url: string;
  type:       string;
  authority:  number;
}

export interface RAGResult {
  ok:          boolean;
  answer:      string;
  sources:     RAGSource[];
  byType:      Record<string, RAGSource[]>;
  opinions:    Opinion[];
  intent:      QueryIntent;
  outputMode:  string;
  quality:     AnswerQuality;
  hasOpinions: boolean;
  model:       string;
  durationMs:  number;
  fromCache:   boolean;
  error?:      string;
}

export interface SavedResearch {
  id:               string;
  title:            string;
  query_text:       string;
  answer_snapshot:  string;
  sources_snapshot: RAGSource[];
  tags:             string[];
  personal_notes:   string;
  saved_at:         string;
  updated_at:       string;
}

export interface HistoryItem {
  id:            string;
  query_text:    string;
  intent:        string;
  answer_quality: string;
  duration_ms:   number;
  created_at:    string;
}

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  quran_verse:   "آية قرآنية",
  hadith:        "حديث نبوي",
  tafsir:        "تفسير",
  fatwa:         "فتوى",
  fiqh_decision: "قرار مجمع فقهي",
  book:          "كتاب",
  lesson:        "درس",
  benefit:       "فائدة",
  article:       "مقال",
  ruling:        "حكم شرعي",
  story:         "قصة",
  quote:         "اقتباس",
  dhikr:         "ذكر",
};

export const CONTENT_TYPE_COLOR: Record<ContentType, string> = {
  quran_verse:   "#1e7e34",
  hadith:        "#856404",
  tafsir:        "#155724",
  fatwa:         "#721c24",
  fiqh_decision: "#004085",
  book:          "#383d41",
  lesson:        "#0c5460",
  benefit:       "#533f03",
  article:       "#3d1a78",
  ruling:        "#856404",
  story:         "#495057",
  quote:         "#212529",
  dhikr:         "#155724",
};

/** الأسئلة المقترحة */
export const QUICK_PROMPTS = [
  { text: "ما حكم قراءة القرآن بدون وضوء؟",  intent: "fiqh" },
  { text: "أين ورد حديث إنما الأعمال بالنيات؟", intent: "hadith" },
  { text: "ما هو تعريف الصلاة لغةً واصطلاحاً؟", intent: "general" },
  { text: "قارن بين مذاهب العلماء في حكم الأذان المسجّل", intent: "compare" },
  { text: "ما أدلة وجوب الزكاة من القرآن والسنة؟", intent: "evidence" },
  { text: "من قال لا تزال طائفة من أمتي ظاهرين؟", intent: "source" },
  { text: "ما الفرق بين الحديث المتواتر والآحاد؟", intent: "general" },
  { text: "ما هي شروط الاجتهاد عند الأصوليين؟", intent: "general" },
  { text: "كيف يستدل الفقهاء على المسائل المستجدة (النوازل)؟", intent: "fiqh" },
  { text: "قارن بين مقاصد الشريعة عند ابن عاشور والشاطبي", intent: "compare" },
];

/** استدعاء بحث RAG */
export async function searchRAG(query: string, options: {
  types?: ContentType[];
  limit?: number;
} = {}): Promise<RAGResult> {
  const res = await fetch(`${BASE}/search`, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify({ query, ...options }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** حفظ بحث في المكتبة الشخصية */
export async function saveResearch(params: {
  title:             string;
  query_text:        string;
  answer_snapshot:   string;
  sources_snapshot:  RAGSource[];
  tags?:             string[];
  personal_notes?:   string;
  research_query_id?: string;
}): Promise<{ ok: boolean; saved?: { id: string; title: string } }> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE}/library/save`, {
    method:  "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** قائمة المكتبة الشخصية */
export async function fetchResearchLibrary(options: { limit?: number; tag?: string } = {}): Promise<SavedResearch[]> {
  const token = await getAuthToken();
  if (!token) return [];

  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.tag)   params.set("tag", options.tag);

  const res = await fetch(`${BASE}/library?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.items || [];
}

/** حذف بحث محفوظ */
export async function deleteResearch(id: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;

  const res = await fetch(`${BASE}/library/${id}`, {
    method:  "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** سجل البحوث */
export async function fetchResearchHistory(): Promise<HistoryItem[]> {
  const token = await getAuthToken();
  if (!token) return [];

  const res = await fetch(`${BASE}/history`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.queries || [];
}

/** إحصائيات فهرس البحث */
export async function fetchIndexStatus(): Promise<{ total: number; byType: Record<string, number> }> {
  const res = await fetch(`${BASE}/index/status`);
  return res.json();
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}
