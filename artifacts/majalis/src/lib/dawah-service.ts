/**
 * خدمة قسم «التعريف بالإسلام» — تُعيد فقط محتوى status='published' AND
 * is_approved=true (يفرضه RLS أيضًا على مستوى القاعدة، هذا تحقّق ثانٍ
 * على مستوى العميل لا أكثر). البحث يعيد استخدام وحدة التطبيع العربي
 * القائمة (@/lib/arabic-search) — لا محرك بحث موازٍ.
 */
import { supabase } from "@/lib/supabase";
import { arabicSearchPatterns, arabicMatchAny, ilikePattern } from "@/lib/arabic-search";
import type { Lang } from "@/lib/language-preference";

export type DawahCategory = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  icon: string | null;
  sort_order: number;
};

export type DawahEvidence = { type: "quran" | "hadith"; ref: string; grading?: string; text: string };
export type DawahSource = { title: string; author?: string; url?: string };
export type DawahGlossaryTerm = { term: string; definition: string };

export type ReligionCode =
  | "christian"
  | "jewish"
  | "hindu"
  | "buddhist"
  | "sikh"
  | "jain"
  | "zoroastrian"
  | "bahai"
  | "chinese_folk"
  | "atheist_agnostic";

export const RELIGIONS: { code: ReligionCode; label: string }[] = [
  { code: "christian", label: "المسيحية" },
  { code: "jewish", label: "اليهودية" },
  { code: "hindu", label: "الهندوسية" },
  { code: "buddhist", label: "البوذية" },
  { code: "sikh", label: "السيخية" },
  { code: "jain", label: "الجاينية" },
  { code: "zoroastrian", label: "الزرادشتية" },
  { code: "bahai", label: "البهائية" },
  { code: "chinese_folk", label: "التقاليد الصينية (كونفوشيوسية/طاوية)" },
  { code: "atheist_agnostic", label: "لا أدين / لا أؤمن بوجود إله" },
];

export const CONTACT_RELIGIONS: { code: ReligionCode | "other_religion" | "no_specific" | "prefer_not_to_say"; label: string }[] = [
  ...RELIGIONS,
  { code: "other_religion", label: "ديانة أخرى" },
  { code: "no_specific", label: "لا أنتمي لديانة محددة" },
  { code: "prefer_not_to_say", label: "أفضّل عدم الذكر" },
];

export type DawahQuestion = {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  short_answer: string;
  detailed_answer: string;
  evidences: DawahEvidence[];
  glossary_terms: DawahGlossaryTerm[];
  sources: DawahSource[];
  related_question_ids: string[];
  keywords: string[];
  target_religion: ReligionCode | null;
  reviewed_at: string | null;
  view_count: number;
  updated_at: string;
};

export type DawahShubha = {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  complexity_level: "basic" | "intermediate" | "advanced";
  shubha_text: string;
  why_spread: string | null;
  short_answer: string;
  detailed_refutation: string;
  assumption_correction: string | null;
  historical_linguistic_context: string | null;
  evidences: DawahEvidence[];
  sources: DawahSource[];
  objections_and_responses: { objection: string; response: string }[];
  conclusion: string | null;
  updated_at: string;
};

export type DawahArticle = {
  id: string;
  category_id: string | null;
  slug: string;
  title_ar: string;
  title_en: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string;
  cover_image_url: string | null;
  tags: string[];
  updated_at: string;
};

export type DawahTranslation = {
  lang: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  status: "draft" | "in_review" | "approved";
};

export async function getQuestionTranslations(questionId: string): Promise<DawahTranslation[]> {
  const { data, error } = await supabase
    .from("dawah_translations")
    .select("lang, title, summary, body, status")
    .eq("entity_type", "question")
    .eq("entity_id", questionId);
  if (error) return [];
  return (data || []) as DawahTranslation[];
}

export type NewMuslimDay = {
  id: string;
  day_number: number;
  audience: "all" | "men" | "women";
  title: string;
  content_ar: string;
  content_en: string | null;
};

const PUBLISHED = { status: "published", is_approved: true } as const;

export async function getDawahCategories(): Promise<DawahCategory[]> {
  const { data, error } = await supabase.from("dawah_categories").select("*").eq("is_active", true).order("sort_order");
  if (error) return [];
  return (data || []) as DawahCategory[];
}

export async function getFeaturedQuestions(limit = 8): Promise<DawahQuestion[]> {
  const { data, error } = await supabase
    .from("dawah_questions")
    .select("*")
    .match(PUBLISHED)
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as DawahQuestion[];
}

export async function getQuestionsByCategory(categorySlug?: string, limit = 50): Promise<DawahQuestion[]> {
  let q = supabase.from("dawah_questions").select("*, dawah_categories!inner(slug)").match(PUBLISHED).order("title").limit(limit);
  if (categorySlug) q = q.eq("dawah_categories.slug", categorySlug);
  const { data, error } = await q;
  if (error) return [];
  return (data || []) as DawahQuestion[];
}

export async function getQuestionsByReligion(religion: ReligionCode, limit = 30): Promise<DawahQuestion[]> {
  const { data, error } = await supabase
    .from("dawah_questions")
    .select("*")
    .match(PUBLISHED)
    .eq("target_religion", religion)
    .order("title")
    .limit(limit);
  if (error) return [];
  return (data || []) as DawahQuestion[];
}

export async function getQuestionBySlug(slug: string): Promise<DawahQuestion | null> {
  const { data, error } = await supabase.from("dawah_questions").select("*").eq("slug", slug).match(PUBLISHED).maybeSingle();
  if (error || !data) return null;
  return data as DawahQuestion;
}

export async function searchDawahQuestions(term: string): Promise<DawahQuestion[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];
  const patterns = arabicSearchPatterns(trimmed);
  if (patterns.length === 0) return [];
  const orFilter = patterns
    .flatMap((p) => {
      const like = ilikePattern(p);
      return ["title", "short_answer"].map((col) => `${col}.ilike.${like}`);
    })
    .join(",");
  const { data, error } = await supabase.from("dawah_questions").select("*").match(PUBLISHED).or(orFilter).limit(20);
  if (error) return [];
  return ((data || []) as DawahQuestion[]).filter((q) => arabicMatchAny([q.title, q.short_answer, ...(q.keywords || [])], trimmed));
}

export async function getFeaturedShubuhat(limit = 6): Promise<DawahShubha[]> {
  const { data, error } = await supabase.from("dawah_shubuhat").select("*").match(PUBLISHED).order("created_at", { ascending: false }).limit(limit);
  if (error) return [];
  return (data || []) as DawahShubha[];
}

export async function getShubuhatByCategory(categorySlug?: string, complexity?: string): Promise<DawahShubha[]> {
  let q = supabase.from("dawah_shubuhat").select("*, dawah_categories!inner(slug)").match(PUBLISHED).order("title");
  if (categorySlug) q = q.eq("dawah_categories.slug", categorySlug);
  if (complexity) q = q.eq("complexity_level", complexity);
  const { data, error } = await q;
  if (error) return [];
  return (data || []) as DawahShubha[];
}

export async function getShubhaBySlug(slug: string): Promise<DawahShubha | null> {
  const { data, error } = await supabase.from("dawah_shubuhat").select("*").eq("slug", slug).match(PUBLISHED).maybeSingle();
  if (error || !data) return null;
  return data as DawahShubha;
}

export async function getArticlesByCategory(categorySlug?: string, limit = 30): Promise<DawahArticle[]> {
  let q = supabase.from("dawah_articles").select("*, dawah_categories!inner(slug)").match(PUBLISHED).order("created_at", { ascending: false }).limit(limit);
  if (categorySlug) q = q.eq("dawah_categories.slug", categorySlug);
  const { data, error } = await q;
  if (error) return [];
  return (data || []) as DawahArticle[];
}

export async function getArticleBySlug(slug: string): Promise<DawahArticle | null> {
  const { data, error } = await supabase.from("dawah_articles").select("*").eq("slug", slug).match(PUBLISHED).maybeSingle();
  if (error || !data) return null;
  return data as DawahArticle;
}

export async function getNewMuslimPath(audience: "all" | "men" | "women" = "all"): Promise<NewMuslimDay[]> {
  const { data, error } = await supabase
    .from("new_muslim_path")
    .select("*")
    .match(PUBLISHED)
    .in("audience", audience === "all" ? ["all"] : ["all", audience])
    .order("day_number");
  if (error) return [];
  return (data || []) as NewMuslimDay[];
}

export async function getNewMuslimProgress(userId: string): Promise<number[]> {
  const { data, error } = await supabase.from("new_muslim_progress").select("day_number").eq("user_id", userId);
  if (error) return [];
  return (data || []).map((r) => r.day_number);
}

export async function markNewMuslimDayComplete(userId: string, dayNumber: number) {
  const { error } = await supabase.from("new_muslim_progress").upsert({ user_id: userId, day_number: dayNumber, completed_at: new Date().toISOString() }, { onConflict: "user_id,day_number" });
  return { ok: !error, error };
}

export type ContactRequestPayload = {
  name?: string;
  isAnonymous: boolean;
  lang: Lang;
  preferredDaeeGender?: "male" | "female" | "no_preference";
  religiousBackground?: ReligionCode | "other_religion" | "no_specific" | "prefer_not_to_say";
  country?: string;
  timezone?: string;
  topic: string;
  contactMethod: string;
  contactValue: string;
  privacyConsent: boolean;
};

export async function submitDawahContactRequest(payload: ContactRequestPayload): Promise<{ ok: boolean; trackingCode?: string; error?: string }> {
  if (!payload.privacyConsent) return { ok: false, error: "consent_required" };
  // نولّد رمز المتابعة من العميل بدل الاعتماد على DEFAULT في القاعدة —
  // RLS يمنع عمدًا أي SELECT عام على هذا الجدول (خصوصية الطلبات)، وبدون
  // ذلك فشل .select() التلقائي بعد INSERT بـ401 رغم نجاح الإدخال نفسه.
  const trackingCode = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const { error } = await supabase
    .from("dawah_contact_requests")
    .insert({
      tracking_code: trackingCode,
      name: payload.isAnonymous ? null : payload.name || null,
      is_anonymous: payload.isAnonymous,
      lang: payload.lang,
      preferred_daee_gender: payload.preferredDaeeGender || "no_preference",
      religious_background: payload.religiousBackground || "prefer_not_to_say",
      country: payload.country || null,
      timezone: payload.timezone || null,
      topic: payload.topic,
      contact_method: payload.contactMethod,
      contact_value: payload.contactValue,
      privacy_consent: payload.privacyConsent,
    });
  if (error) return { ok: false, error: error.message };
  return { ok: true, trackingCode };
}

/* ── إدارة ── */

export async function adminListDawahQueue(table: "dawah_questions" | "dawah_shubuhat" | "dawah_articles" | "new_muslim_path") {
  const { data, error } = await supabase.from(table).select("*").neq("status", "published").order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpdateDawahStatus(
  table: "dawah_questions" | "dawah_shubuhat" | "dawah_articles" | "new_muslim_path",
  id: string,
  status: string,
  approve = false,
) {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (approve) {
    patch.is_approved = true;
    patch.reviewed_at = new Date().toISOString();
  }
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  return { ok: !error, error };
}

export async function adminListContactRequests(status?: string) {
  let q = supabase.from("dawah_contact_requests").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  return { data: data || [], error };
}

export async function adminAssignContactRequest(id: string, assignedTo: string) {
  const { error } = await supabase.from("dawah_contact_requests").update({ status: "assigned", assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq("id", id);
  return { ok: !error, error };
}

export async function adminUpdateContactStatus(id: string, status: string, notes?: string) {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "responded") patch.responded_at = new Date().toISOString();
  if (notes) patch.notes = notes;
  const { error } = await supabase.from("dawah_contact_requests").update(patch).eq("id", id);
  return { ok: !error, error };
}
